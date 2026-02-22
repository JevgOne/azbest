export interface ShoptetConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  accessToken: string;
}

export interface ShoptetProduct {
  guid: string;
  name: string;
  slug: string;
  brand: string | null;
  category: string | null;
  price: number;
  priceBeforeDiscount: number | null;
  stock: number;
  ean: string | null;
  sku: string | null;
  images: string[];
  variants: ShoptetVariant[];
  visibility: string;
}

export interface ShoptetVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string | null;
}

export interface ShoptetOrder {
  code: string;
  orderNumber: string;
  email: string;
  customerName: string;
  status: string;
  paymentMethod: string;
  shippingMethod: string;
  totalPrice: number;
  currency: string;
  items: ShoptetOrderItem[];
  createdAt: string;
}

export interface ShoptetOrderItem {
  name: string;
  code: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ShoptetCustomer {
  guid: string;
  email: string;
  name: string;
  phone: string | null;
  createdAt: string;
}

export interface SyncStatus {
  id: number;
  entity_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  items_synced: number;
  items_total: number;
  error_message: string | null;
  started_at: number | null;
  completed_at: number | null;
  created_at: number;
}
