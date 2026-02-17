import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { chatFunctions } from '@/lib/chat-functions';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages,
    system: `You are an AI assistant for an M&A (Mergers & Acquisitions) synergies analysis platform.

Your role is to help users query and analyze M&A synergies data using natural language.

Key capabilities:
- Search synergies by industry, status, value range, or keywords
- Get detailed information about specific synergies
- Analyze synergies grouped by various dimensions
- Provide insights and summaries of synergy data

Guidelines:
- Be concise and professional
- When showing synergy results, format them clearly with key metrics
- Use the available tools to query the database - never make up data
- If a query is ambiguous, ask for clarification
- Suggest relevant follow-up questions based on the results
- Format currency values clearly (use the provided formatted values)

When users ask vague questions like "show me synergies", ask them to be more specific:
- Which industry? (Technology, Healthcare, Manufacturing, etc.)
- What status? (Identified, In Progress, Realized, At Risk)
- What value range? (Over $1M, under $10M, etc.)

Always be helpful and guide users to get the most value from the data.`,
    tools: {
      search_synergies: tool({
        description: chatFunctions.search_synergies.description,
        parameters: chatFunctions.search_synergies.parameters,
        execute: chatFunctions.search_synergies.execute,
      }),
      get_synergy_details: tool({
        description: chatFunctions.get_synergy_details.description,
        parameters: chatFunctions.get_synergy_details.parameters,
        execute: chatFunctions.get_synergy_details.execute,
      }),
      analyze_synergies: tool({
        description: chatFunctions.analyze_synergies.description,
        parameters: chatFunctions.analyze_synergies.parameters,
        execute: chatFunctions.analyze_synergies.execute,
      }),
      get_industries: tool({
        description: chatFunctions.get_industries.description,
        parameters: chatFunctions.get_industries.parameters,
        execute: chatFunctions.get_industries.execute,
      }),
      get_functions: tool({
        description: chatFunctions.get_functions.description,
        parameters: chatFunctions.get_functions.parameters,
        execute: chatFunctions.get_functions.execute,
      }),
    },
    maxTokens: 1024,
    temperature: 0.3, // Lower temperature for more consistent responses
  });

  return result.toDataStreamResponse();
}
