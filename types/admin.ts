export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'specialist';
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  ordersToday: number;
  revenueToday: number;
  abandonedCarts: number;
  conversionRate: number;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: number;
}

export interface ActivityLogEntry {
  id: number;
  user_id: string;
  user_email: string;
  user_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_name: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: number;
}
