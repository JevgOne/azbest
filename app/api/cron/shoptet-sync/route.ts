import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { syncProducts } = await import('@/lib/shoptet/products');
    const { syncOrders } = await import('@/lib/shoptet/orders');
    const { syncCustomers } = await import('@/lib/shoptet/customers');

    const [productsResult, ordersResult, customersResult] = await Promise.all([
      syncProducts().catch((e: any) => ({ synced: 0, error: e.message })),
      syncOrders().catch((e: any) => ({ synced: 0, error: e.message })),
      syncCustomers().catch((e: any) => ({ synced: 0, error: e.message })),
    ]);

    return NextResponse.json({
      success: true,
      data: { products: productsResult, orders: ordersResult, customers: customersResult },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
