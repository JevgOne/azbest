export interface GeneratedImage {
  id: number;
  prompt: string;
  style: string | null;
  dimensions: string;
  image_url: string;
  thumbnail_url: string | null;
  model: string;
  category: string | null;
  tags: string[];
  used_in: any;
  created_by: string | null;
  created_at: number;
}

export interface ImageGenerationRequest {
  prompt: string;
  style?: string;
  dimensions?: '1024x1024' | '1024x1792' | '1792x1024';
  category?: 'product' | 'banner' | 'social' | 'brand';
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  category: string;
  variables: string[];
}
