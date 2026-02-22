export interface SocialPost {
  id: number;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok';
  type: 'post' | 'story' | 'reel' | 'carousel';
  content: string;
  media_urls: string[];
  hashtags: string[];
  link: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_at: number | null;
  published_at: number | null;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  engagement_rate: number;
  external_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  category: string | null;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  seo_score: number;
  status: 'draft' | 'published' | 'archived';
  author_id: string | null;
  published_at: number | null;
  created_at: number;
  updated_at: number;
}
