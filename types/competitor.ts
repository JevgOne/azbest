export interface Competitor {
  id: number;
  name: string;
  url: string;
  description: string | null;
  brands: string[];
  categories: string[];
  monitoring_enabled: boolean;
  last_checked_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface CompetitorPrice {
  id: number;
  competitor_id: number;
  product_name: string;
  product_url: string | null;
  our_product_id: number | null;
  competitor_price: number;
  our_price: number | null;
  price_difference: number | null;
  currency: string;
  checked_at: number;
}

export interface SeasonalEvent {
  id: number;
  name: string;
  type: 'sport_season' | 'holiday' | 'sale' | 'event' | 'custom';
  description: string | null;
  start_date: string;
  end_date: string;
  categories: string[];
  brands: string[];
  marketing_actions: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'active' | 'completed';
  created_at: number;
}

export interface UTMCampaign {
  id: number;
  name: string;
  source: string;
  medium: string;
  campaign: string;
  content: string | null;
  term: string | null;
  url: string;
  generated_url: string;
  clicks: number;
  conversions: number;
  revenue: number;
  notes: string | null;
  created_at: number;
}
