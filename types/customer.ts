export interface Customer {
  id: number;
  shoptet_id: string | null;
  email: string;
  name: string | null;
  phone: string | null;
  total_orders: number;
  total_spent: number;
  first_order_at: number | null;
  last_order_at: number | null;
  rfm_recency: number | null;
  rfm_frequency: number | null;
  rfm_monetary: number | null;
  rfm_segment: string | null;
  rfm_score: string | null;
  sport_interests: string[];
  tags: string[];
  created_at: number;
  updated_at: number;
}

export interface RFMSegment {
  name: string;
  label: string;
  description: string;
  color: string;
  count: number;
  percentage: number;
}

export interface AbandonedCart {
  id: number;
  session_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  items: CartItem[];
  total_price: number;
  currency: string;
  recovered: boolean;
  recovery_email_sent: boolean;
  abandoned_at: number;
  recovered_at: number | null;
  created_at: number;
}

export interface CartItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
}
