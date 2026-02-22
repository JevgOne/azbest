export interface PromoCode {
  id: number;
  code: string;
  description: string | null;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  min_order_value: number | null;
  max_uses: number | null;
  used_count: number;
  valid_from: number | null;
  valid_to: number | null;
  target_segment: string | null;
  shoptet_synced: boolean;
  active: boolean;
  created_at: number;
  updated_at: number;
}
