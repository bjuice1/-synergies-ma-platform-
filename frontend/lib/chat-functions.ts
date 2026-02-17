import { z } from 'zod';
import { synergiesApi, industriesApi, functionsApi } from './api';
import type { Synergy } from './types';
import { formatCompactNumber } from './utils';

// Schema definitions for function parameters
export const searchSynergiesSchema = z.object({
  industry_id: z.number().optional().describe('ID of the industry to filter by'),
  function_id: z.number().optional().describe('ID of the function to filter by'),
  status: z
    .enum(['IDENTIFIED', 'IN_PROGRESS', 'REALIZED', 'AT_RISK'])
    .optional()
    .describe('Status of the synergy'),
  min_value: z.number().optional().describe('Minimum synergy value in dollars'),
  max_value: z.number().optional().describe('Maximum synergy value in dollars'),
  search: z.string().optional().describe('Search term to filter synergies'),
  sort_by: z
    .enum(['created_at', 'value_high', 'value_low', 'synergy_type'])
    .optional()
    .describe('Field to sort by'),
  sort_order: z.enum(['asc', 'desc']).optional().describe('Sort order'),
});

export const getSynergyDetailsSchema = z.object({
  synergy_id: z.number().describe('ID of the synergy to retrieve'),
});

export const analyzeSynergiesSchema = z.object({
  group_by: z
    .enum(['status', 'industry', 'function', 'confidence'])
    .describe('How to group the synergies for analysis'),
});

// Function implementations
export const chatFunctions = {
  search_synergies: {
    description:
      'Search and filter M&A synergies based on various criteria like industry, status, value range, or text search. Returns a list of matching synergies.',
    parameters: searchSynergiesSchema,
    execute: async (params: z.infer<typeof searchSynergiesSchema>) => {
      try {
        const filters: any = {};

        if (params.industry_id) filters.industry_id = params.industry_id;
        if (params.function_id) filters.function_id = params.function_id;
        if (params.status) filters.status = params.status;
        if (params.search) filters.search = params.search;
        if (params.sort_by) filters.sort_by = params.sort_by;
        if (params.sort_order) filters.sort_order = params.sort_order;

        let synergies = await synergiesApi.getAll(filters);

        // Apply value filters (client-side since API might not support them)
        if (params.min_value !== undefined) {
          synergies = synergies.filter(
            (s) => (s.value_low + s.value_high) / 2 >= params.min_value!
          );
        }
        if (params.max_value !== undefined) {
          synergies = synergies.filter(
            (s) => (s.value_low + s.value_high) / 2 <= params.max_value!
          );
        }

        return {
          success: true,
          count: synergies.length,
          synergies: synergies.map((s) => ({
            id: s.id,
            type: s.synergy_type,
            description: s.description,
            value_range: `${formatCompactNumber(s.value_low)} - ${formatCompactNumber(s.value_high)}`,
            status: s.status,
            timeline: s.realization_timeline,
            confidence: s.confidence_level,
          })),
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to search synergies',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  },

  get_synergy_details: {
    description:
      'Get complete details for a specific synergy by its ID. Returns all information including industry, function, category, and full description.',
    parameters: getSynergyDetailsSchema,
    execute: async (params: z.infer<typeof getSynergyDetailsSchema>) => {
      try {
        const synergy = await synergiesApi.getById(params.synergy_id);

        return {
          success: true,
          synergy: {
            id: synergy.id,
            type: synergy.synergy_type,
            description: synergy.description,
            value_low: synergy.value_low,
            value_high: synergy.value_high,
            average_value: (synergy.value_low + synergy.value_high) / 2,
            status: synergy.status,
            timeline: synergy.realization_timeline,
            confidence: synergy.confidence_level,
            industry: synergy.industry?.name || 'N/A',
            function: synergy.function?.name || 'N/A',
            created_at: synergy.created_at,
            updated_at: synergy.updated_at,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to get synergy details',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  },

  analyze_synergies: {
    description:
      'Analyze all synergies and provide aggregated statistics grouped by status, industry, function, or confidence level. Useful for getting high-level insights.',
    parameters: analyzeSynergiesSchema,
    execute: async (params: z.infer<typeof analyzeSynergiesSchema>) => {
      try {
        const synergies = await synergiesApi.getAll();

        const analysis: any = {
          total_count: synergies.length,
          total_value: synergies.reduce(
            (sum, s) => sum + (s.value_low + s.value_high) / 2,
            0
          ),
        };

        // Group by requested dimension
        const groups: Record<string, any> = {};

        synergies.forEach((s) => {
          let key: string;

          switch (params.group_by) {
            case 'status':
              key = s.status;
              break;
            case 'industry':
              key = s.industry?.name || 'Uncategorized';
              break;
            case 'function':
              key = s.function?.name || 'Uncategorized';
              break;
            case 'confidence':
              key = s.confidence_level || 'Unknown';
              break;
            default:
              key = 'Other';
          }

          if (!groups[key]) {
            groups[key] = {
              count: 0,
              total_value: 0,
              synergies: [],
            };
          }

          const avgValue = (s.value_low + s.value_high) / 2;
          groups[key].count++;
          groups[key].total_value += avgValue;
          groups[key].synergies.push({
            id: s.id,
            type: s.synergy_type,
            value: avgValue,
          });
        });

        // Format groups for readability
        analysis.groups = Object.entries(groups).map(([name, data]: [string, any]) => ({
          name,
          count: data.count,
          total_value: formatCompactNumber(data.total_value),
          percentage: ((data.count / synergies.length) * 100).toFixed(1) + '%',
          top_synergies: data.synergies
            .sort((a: any, b: any) => b.value - a.value)
            .slice(0, 3)
            .map((s: any) => ({
              id: s.id,
              type: s.type,
              value: formatCompactNumber(s.value),
            })),
        }));

        return {
          success: true,
          grouped_by: params.group_by,
          ...analysis,
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to analyze synergies',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  },

  get_industries: {
    description: 'Get a list of all available industries in the system.',
    parameters: z.object({}),
    execute: async () => {
      try {
        const industries = await industriesApi.getAll();
        return {
          success: true,
          industries: industries.map((i) => ({
            id: i.id,
            name: i.name,
            description: i.description,
          })),
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to get industries',
        };
      }
    },
  },

  get_functions: {
    description: 'Get a list of all available business functions in the system.',
    parameters: z.object({}),
    execute: async () => {
      try {
        const functions = await functionsApi.getAll();
        return {
          success: true,
          functions: functions.map((f) => ({
            id: f.id,
            name: f.name,
            description: f.description,
          })),
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to get functions',
        };
      }
    },
  },
};

// Export type for function names
export type ChatFunctionName = keyof typeof chatFunctions;
