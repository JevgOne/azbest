export interface AnalyticsSnapshot {
  id: number;
  date: string;
  users: number;
  sessions: number;
  page_views: number;
  bounce_rate: number;
  avg_session_duration: number;
  conversions: number;
  revenue: number;
  top_pages: any[];
  traffic_sources: any[];
  device_breakdown: any[];
}

export interface SearchConsoleEntry {
  date: string;
  query: string | null;
  page: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SEOAudit {
  id: number;
  url: string;
  score: number;
  performance_score: number;
  accessibility_score: number;
  best_practices_score: number;
  seo_score: number;
  issues: SEOIssue[];
  opportunities: any[];
}

export interface SEOIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

export interface SEOKeyword {
  id: number;
  keyword: string;
  target_url: string | null;
  current_position: number | null;
  previous_position: number | null;
  best_position: number | null;
  search_volume: number | null;
  difficulty: number | null;
  tracking_enabled: boolean;
  created_at: number;
  updated_at: number;
}

export interface Report {
  id: number;
  type: 'weekly' | 'monthly' | 'custom';
  title: string;
  date_from: string;
  date_to: string;
  data: any;
  pdf_url: string | null;
  status: string;
  created_by: string | null;
  created_at: number;
}
