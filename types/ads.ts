// Unified advertising types

export type AdPlatform = 'google_ads' | 'meta_ads' | 'sklik' | 'heureka' | 'zbozi' | 'mergado';

export type SyncType = 'campaigns' | 'daily_stats' | 'keywords' | 'feeds' | 'reviews' | 'full';

export type SyncStatus = 'running' | 'completed' | 'failed';

export type CampaignStatus = 'active' | 'paused' | 'removed' | 'ended';

export interface AdCampaign {
  id: number;
  platform: AdPlatform;
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
  created_at: number;
}

export interface AdKeyword {
  id: number;
  campaign_id: number | null;
  platform: AdPlatform;
  keyword: string;
  match_type: string;
  status: string;
  bid: number | null;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  quality_score: number | null;
  created_at: number;
  updated_at: number;
}

export interface AdSyncLog {
  id: number;
  platform: AdPlatform;
  sync_type: SyncType;
  status: SyncStatus;
  campaigns_synced: number;
  stats_synced: number;
  error_message: string | null;
  date_from: string | null;
  date_to: string | null;
  started_at: number;
  completed_at: number | null;
}

export interface AdRecommendation {
  id: number;
  platform: AdPlatform;
  campaign_id: number | null;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  estimated_impact: string | null;
  status: 'pending' | 'applied' | 'dismissed';
  ai_generated: number;
  created_at: number;
}

export interface HeurekaBid {
  id: number;
  product_id: number | null;
  product_name: string;
  category: string | null;
  current_bid: number;
  max_cpc: number | null;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  active: number;
  updated_at: number;
  created_at: number;
}

export interface MergadoFeed {
  id: number;
  mergado_id: string;
  name: string;
  format: string;
  url: string | null;
  products_count: number;
  status: string;
  last_rebuild_at: number | null;
  synced_at: number;
  created_at: number;
  updated_at: number;
}

export interface MergadoRule {
  id: number;
  feed_id: number;
  mergado_rule_id: string;
  name: string;
  type: string | null;
  status: string;
  priority: number;
  created_at: number;
}

export interface UtmAdMapping {
  id: number;
  platform: AdPlatform;
  campaign_id: number | null;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  created_at: number;
}

// Sync function result
export interface SyncResult {
  platform: AdPlatform;
  syncType: SyncType;
  campaignsSynced: number;
  statsSynced: number;
  error?: string;
}

// Unified cross-platform stats
export interface UnifiedPlatformStats {
  platform: AdPlatform;
  label: string;
  connected: boolean;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  roas: number;
  ctr: number;
  cpc: number;
  campaignCount: number;
}

export interface UnifiedDailyStats {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
}

export interface RoasData {
  campaign_id: number;
  campaign_name: string;
  platform: AdPlatform;
  spend: number;
  revenue: number;
  roas: number;
  orders: number;
}

export const PLATFORM_LABELS: Record<AdPlatform, string> = {
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
  sklik: 'Sklik',
  heureka: 'Heureka',
  zbozi: 'Zboží.cz',
  mergado: 'Mergado',
};

export const PLATFORM_COLORS: Record<AdPlatform, string> = {
  google_ads: '#4285F4',
  meta_ads: '#1877F2',
  sklik: '#C42E1F',
  heureka: '#A7CB38',
  zbozi: '#C50039',
  mergado: '#FF6B00',
};
