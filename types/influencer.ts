export interface Influencer {
  id: number;
  name: string;
  handle: string | null;
  platform: 'instagram' | 'youtube' | 'tiktok' | 'facebook' | 'blog';
  followers: number;
  engagement_rate: number;
  sport: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: 'prospect' | 'contacted' | 'active' | 'inactive';
  cost_per_post: number | null;
  total_spent: number;
  created_at: number;
  updated_at: number;
}

export interface InfluencerPost {
  id: number;
  influencer_id: number;
  platform: string;
  post_url: string | null;
  content: string | null;
  post_type: string | null;
  likes: number;
  comments: number;
  reach: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cost: number;
  posted_at: number | null;
  created_at: number;
}
