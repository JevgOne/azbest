export interface Product {
  id: number;
  shoptet_id: string;
  name: string;
  slug: string | null;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  price: number;
  price_before_discount: number | null;
  currency: string;
  stock: number;
  ean: string | null;
  sku: string | null;
  weight: number | null;
  description: string | null;
  short_description: string | null;
  images: string[];
  variants: any[];
  parameters: Record<string, any>;
  visibility: string;
  created_at: number;
  updated_at: number;
  synced_at: number;
}
