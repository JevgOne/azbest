import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');

    const now = Math.floor(Date.now() / 1000);
    const todayStart = now - (now % 86400);
    const monthStart = now - 30 * 86400;

    const [products, orders, customers, abandoned, ordersToday, revenueMonth, recentActivity, socialPosts] = await Promise.all([
      turso.execute({ sql: 'SELECT COUNT(*) as count FROM products', args: [] }).catch(() => ({ rows: [{ count: 0 }] })),
      turso.execute({ sql: 'SELECT COUNT(*) as count FROM orders', args: [] }).catch(() => ({ rows: [{ count: 0 }] })),
      turso.execute({ sql: 'SELECT COUNT(*) as count FROM customers', args: [] }).catch(() => ({ rows: [{ count: 0 }] })),
      turso.execute({ sql: 'SELECT COUNT(*) as count FROM abandoned_carts WHERE recovered = 0', args: [] }).catch(() => ({ rows: [{ count: 0 }] })),
      turso.execute({ sql: 'SELECT COUNT(*) as count FROM orders WHERE created_at >= ?', args: [todayStart] }).catch(() => ({ rows: [{ count: 0 }] })),
      turso.execute({ sql: 'SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE created_at >= ?', args: [monthStart] }).catch(() => ({ rows: [{ total: 0 }] })),
      turso.execute({ sql: 'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10', args: [] }).catch(() => ({ rows: [] })),
      turso.execute({ sql: "SELECT COUNT(*) as count FROM social_posts WHERE status = 'published'", args: [] }).catch(() => ({ rows: [{ count: 0 }] })),
    ]);

    const totalRevenueResult = await turso.execute({
      sql: 'SELECT COALESCE(SUM(total_price), 0) as total FROM orders',
      args: [],
    }).catch(() => ({ rows: [{ total: 0 }] }));

    return NextResponse.json({
      success: true,
      data: {
        totalProducts: (products.rows[0] as any)?.count || 0,
        totalOrders: (orders.rows[0] as any)?.count || 0,
        ordersToday: (ordersToday.rows[0] as any)?.count || 0,
        totalCustomers: (customers.rows[0] as any)?.count || 0,
        abandonedCarts: (abandoned.rows[0] as any)?.count || 0,
        totalRevenue: (totalRevenueResult.rows[0] as any)?.total || 0,
        revenueMonth: (revenueMonth.rows[0] as any)?.total || 0,
        socialPosts: (socialPosts.rows[0] as any)?.count || 0,
        recentActivity: recentActivity.rows,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: true, data: {
      totalProducts: 0, totalOrders: 0, totalCustomers: 0,
      abandonedCarts: 0, totalRevenue: 0,
    }});
  }
}
