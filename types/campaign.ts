export interface AdCampaign {
  id: number;
  platform: 'google_ads' | 'meta_ads' | 'sklik' | 'heureka' | 'zbozi';
  external_id: string;
  name: string;
  status: string;
  campaign_type: string | null;
  daily_budget: number | null;
  total_budget: number | null;
  currency: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  roas: number;
  ctr: number;
  cpc: number;
  start_date: number | null;
  end_date: number | null;
  created_at: number;
  updated_at: number;
  synced_at: number;
}

export interface CampaignDailyStats {
  id: number;
  campaign_id: number;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  roas: number;
}

export interface AdKeyword {
  id: number;
  campaign_id: number | null;
  platform: string;
  keyword: string;
  match_type: string;
  status: string;
  bid: number | null;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  quality_score: number | null;
}

export interface AdRecommendation {
  id: number;
  platform: string;
  campaign_id: number | null;
  type: 'budget' | 'keyword' | 'targeting' | 'creative';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  estimated_impact: string | null;
  status: 'pending' | 'applied' | 'dismissed';
  ai_generated: boolean;
  created_at: number;
}

export interface ProductFeed {
  id: number;
  platform: string;
  name: string;
  url: string | null;
  format: string;
  products_count: number;
  last_generated_at: number | null;
  status: string;
}
