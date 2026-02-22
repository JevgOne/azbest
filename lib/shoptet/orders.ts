import { shoptetRequest } from './client';

export async function fetchOrders(page: number = 1, itemsPerPage: number = 100) {
  return shoptetRequest<any>('/orders', {
    params: { page: String(page), itemsPerPage: String(itemsPerPage) },
  });
}

export async function fetchOrderDetail(code: string) {
  return shoptetRequest<any>(`/orders/${code}`);
}

export async function syncOrders() {
  const { turso } = await import('@/lib/turso');
  let page = 1;
  let totalSynced = 0;

  while (true) {
    try {
      const data = await fetchOrders(page);
      const orders = data?.orders || [];
      if (orders.length === 0) break;

      for (const order of orders) {
        await turso.execute({
          sql: `INSERT INTO orders (shoptet_id, order_number, customer_email, customer_name, status, payment_method, shipping_method, total_price, currency, items, synced_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())
                ON CONFLICT(shoptet_id) DO UPDATE SET
                status=excluded.status, total_price=excluded.total_price, items=excluded.items,
                synced_at=unixepoch(), updated_at=unixepoch()`,
          args: [
            order.code, order.code, order.email || null,
            order.billingAddress?.fullName || null, order.status?.id || 'unknown',
            order.paymentMethod?.name || null, order.shipping?.name || null,
            order.price?.withVat || 0, order.price?.currencyCode || 'CZK',
            JSON.stringify(order.items || []),
          ],
        });
        totalSynced++;
      }

      if (orders.length < 100) break;
      page++;
    } catch (error) {
      console.error(`Error syncing orders page ${page}:`, error);
      break;
    }
  }

  return { synced: totalSynced };
}
