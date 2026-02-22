export interface Order {
  id: number;
  shoptet_id: string;
  order_number: string;
  customer_email: string | null;
  customer_name: string | null;
  status: string;
  payment_method: string | null;
  shipping_method: string | null;
  total_price: number;
  currency: string;
  items: OrderItem[];
  billing_address: Address | null;
  shipping_address: Address | null;
  notes: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  created_at: number;
  updated_at: number;
  synced_at: number;
}

export interface OrderItem {
  name: string;
  code: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Address {
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
}
