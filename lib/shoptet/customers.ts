import { shoptetRequest } from './client';

export async function fetchCustomers(page: number = 1, itemsPerPage: number = 100) {
  return shoptetRequest<any>('/customers', {
    params: { page: String(page), itemsPerPage: String(itemsPerPage) },
  });
}

export async function syncCustomers() {
  const { turso } = await import('@/lib/turso');
  let page = 1;
  let totalSynced = 0;

  while (true) {
    try {
      const data = await fetchCustomers(page);
      const customers = data?.customers || [];
      if (customers.length === 0) break;

      for (const customer of customers) {
        if (!customer.email) continue;
        await turso.execute({
          sql: `INSERT INTO customers (shoptet_id, email, name, phone, updated_at)
                VALUES (?, ?, ?, ?, unixepoch())
                ON CONFLICT(email) DO UPDATE SET
                shoptet_id=excluded.shoptet_id, name=excluded.name, phone=excluded.phone,
                updated_at=unixepoch()`,
          args: [
            customer.guid || null, customer.email,
            customer.billingAddress?.fullName || null, customer.phone || null,
          ],
        });
        totalSynced++;
      }

      if (customers.length < 100) break;
      page++;
    } catch (error) {
      console.error(`Error syncing customers page ${page}:`, error);
      break;
    }
  }

  return { synced: totalSynced };
}
