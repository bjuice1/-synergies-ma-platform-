// Company types
export interface Company {
  id: number;
  name: string;
  industry: string;
  description?: string;
  revenue_usd?: number;
  employees?: number;
  geography?: string[];
  products?: string[];
  tech_stack?: string[];
  strengths?: string[];
  weaknesses?: string[];
  created_at: string;
  updated_at: string;
}

// Deal types
export interface Deal {
  id: number;
  name: string;
  deal_type: 'acquisition' | 'merger' | 'jv' | 'partnership';
  deal_size_usd?: number;
  close_date?: string;
  strategic_rationale?: string;
  acquirer_id: number;
  target_id: number;
  acquirer?: Company;
  target?: Company;
  status: 'draft' | 'active' | 'closed' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Optional expanded fields
  synergies?: Synergy[];
  synergies_count?: number;
  total_value_low?: number;
  total_value_high?: number;
}

// Core entity types
export interface Synergy {
  id: number;
  source_entity_id: number;
  target_entity_id: number;
  synergy_type: string;
  value_low: number;
  value_high: number;
  description: string;
  realization_timeline: string;
  confidence_level: string;
  status: 'IDENTIFIED' | 'IN_PROGRESS' | 'REALIZED' | 'AT_RISK';
  industry_id?: number;
  function_id?: number;
  category_id?: number;
  created_at: string;
  updated_at: string;
  // Optional expanded relations
  industry?: Industry;
  function?: Function;
  category?: Category;
  source_entity?: Entity;
  target_entity?: Entity;
  // Business Intelligence extensions
  current_workflow_state?: WorkflowState;
  workflow_transitions?: WorkflowTransition[];
  metrics?: SynergyMetric[];
}

export interface Entity {
  id: number;
  name: string;
  type: 'ACQUIRER' | 'TARGET';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Industry {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Function {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

// API response types
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Form types
export interface CreateSynergyInput {
  source_entity_id: number;
  target_entity_id: number;
  synergy_type: string;
  value_low: number;
  value_high: number;
  description: string;
  realization_timeline: string;
  confidence_level: string;
  status: Synergy['status'];
  industry_id?: number;
  function_id?: number;
  category_id?: number;
}

export interface UpdateSynergyInput extends Partial<CreateSynergyInput> {
  id: number;
}

export interface SynergyFilters {
  industry_id?: number;
  function_id?: number;
  category_id?: number;
  status?: Synergy['status'];
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Dashboard stats
export interface DashboardStats {
  total_synergies: number;
  realized_value: number;
  in_progress_count: number;
  estimated_total_value: number;
  by_status: {
    [key: string]: number;
  };
  by_industry: {
    name: string;
    value: number;
    count: number;
  }[];
  recent_synergies: Synergy[];
}

// Chart data types
export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface TimelineDataPoint {
  date: string;
  value: number;
  label?: string;
}

// Workflow Types
export type WorkflowState = "draft" | "review" | "approved" | "realized" | "rejected";
export type WorkflowAction = "submit" | "approve" | "reject" | "realize" | "return_to_draft";

export interface WorkflowTransition {
  id: number;
  synergy_id: number;
  from_state: WorkflowState;
  to_state: WorkflowState;
  action: WorkflowAction;
  user_id: number;
  user_email: string;
  comment: string | null;
  created_at: string;
}

// Metrics Types
export interface SynergyMetric {
  id: number;
  synergy_id: number;
  metric_type: string;
  category: string;
  line_item: string;
  value: number;
  unit: string;
  description: string;
  confidence: "high" | "medium" | "low";
  assumption: string;
  data_source: string;
  created_at: string;
}

export interface SynergyMetricsResponse {
  synergy_id: number;
  total_value_low: number;
  total_value_high: number;
  metrics: SynergyMetric[];
}

// Learning section — lever playbook
export interface LeverPlaybook {
  id: number;
  lever_id: number;
  lever_name: string | null;
  lever_type: string | null;
  what_it_is: string | null;
  what_drives_it: string | null;
  diligence_questions: string[];
  red_flags: string[];
  team_notes: string | null;
  last_edited_by: string | null;
  updated_at: string | null;
}

export interface LeverWithPlaybook {
  lever_id: number;
  lever_name: string;
  lever_type: 'cost' | 'revenue';
  sort_order: number;
  description: string | null;
  playbook: LeverPlaybook | null;
}

// Lever / benchmarking types
export interface SynergyLever {
  id: number;
  name: string;
  description?: string;
  lever_type: 'cost' | 'revenue';
  sort_order: number;
}

export interface SynergyActivity {
  id: number;
  synergy_type: string;
  description: string;
  value_low: number;
  value_high: number;
  status: string;
  confidence_score: number;
}

export interface DealLever {
  id: number;
  deal_id: number;
  lever_id: number;
  lever_name: string;
  lever_type: 'cost' | 'revenue';
  benchmark_pct_low: number;
  benchmark_pct_high: number;
  benchmark_pct_median: number;
  benchmark_n: number;
  combined_baseline_usd: number;
  calculated_value_low: number;
  calculated_value_high: number;
  status: 'identified' | 'in_analysis' | 'validated' | 'excluded';
  confidence: 'high' | 'medium' | 'low';
  advisor_notes?: string;
  activities: SynergyActivity[];
}

export interface DealLeversResponse {
  deal_id: number;
  levers: DealLever[];
  summary: {
    total_cost_synergy_low: number;
    total_cost_synergy_high: number;
    combined_revenue: number;
    total_pct_low: number;
    total_pct_high: number;
    benchmark_n: number;
  };
}
