export interface BrandAsset {
  id: number;
  name: string;
  type: 'logo' | 'icon' | 'banner' | 'photo' | 'video' | 'font' | 'color' | 'guideline';
  file_url: string | null;
  thumbnail_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  dimensions: string | null;
  metadata: Record<string, any> | null;
  tags: string[];
  created_at: number;
  updated_at: number;
}

export interface BrandColor {
  name: string;
  hex: string;
  rgb: string;
  usage: string;
}

export interface BrandGuide {
  colors: BrandColor[];
  fonts: { name: string; usage: string; url?: string }[];
  logoUrl: string;
  guidelines: string;
}
