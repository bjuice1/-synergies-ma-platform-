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
