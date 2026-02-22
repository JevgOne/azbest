import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';
import { logActivity } from '@/lib/activity-log';

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { type } = await request.json();
    let result;

    switch (type) {
      case 'products':
        const { syncProducts } = await import('@/lib/shoptet/products');
        result = await syncProducts();
        break;
      case 'orders':
        const { syncOrders } = await import('@/lib/shoptet/orders');
        result = await syncOrders();
        break;
      case 'customers':
        const { syncCustomers } = await import('@/lib/shoptet/customers');
        result = await syncCustomers();
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid sync type' }, { status: 400 });
    }

    await logActivity({ userId: user.id, userEmail: user.email, userName: user.name, action: 'shoptet_sync', entityType: 'product', details: `Synced ${type}: ${JSON.stringify(result)}` }).catch(() => {});

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
