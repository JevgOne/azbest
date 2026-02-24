export type GenViralPlatform = 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'pinterest' | 'linkedin';

export type GenViralPostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'partially_failed';

export type TikTokPublishMode = 'MEDIA_UPLOAD' | 'DIRECT_POST';

export interface GenViralAccount {
  id: string;
  platform: GenViralPlatform;
  username: string;
  display_name: string | null;
  profile_image_url: string | null;
  connected: boolean;
  synced_at: number;
}

export interface GenViralPostAccountState {
  account_id: string;
  platform: GenViralPlatform;
  status: 'pending' | 'publishing' | 'published' | 'failed';
  external_post_id: string | null;
  error_message: string | null;
  published_at: string | null;
}

export interface GenViralPost {
  id: string;
  caption: string;
  media_urls: string[];
  scheduled_at: string | null;
  published_at: string | null;
  status: GenViralPostStatus;
  account_states: GenViralPostAccountState[];
  metadata: {
    source: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface GenViralPostCreateRequest {
  caption: string;
  media_urls: string[];
  account_ids: string[];
  scheduled_at?: string;
  tiktok_publish_mode?: TikTokPublishMode;
  metadata?: Record<string, any>;
}

export interface GenViralPostUpdateRequest {
  caption?: string;
  scheduled_at?: string;
}

export interface GenViralAnalytics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface GenViralSlideshowConfig {
  images: string[];
  aspect_ratio: '9:16';
}
