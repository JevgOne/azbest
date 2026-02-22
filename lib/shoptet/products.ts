import { shoptetRequest } from './client';

export async function fetchProducts(page: number = 1, itemsPerPage: number = 100) {
  return shoptetRequest<any>('/products', {
    params: { page: String(page), itemsPerPage: String(itemsPerPage) },
  });
}

export async function fetchProductDetail(guid: string) {
  return shoptetRequest<any>(`/products/${guid}`);
}

export async function syncProducts() {
  const { turso } = await import('@/lib/turso');
  let page = 1;
  let totalSynced = 0;

  while (true) {
    try {
      const data = await fetchProducts(page);
      const products = data?.products || [];
      if (products.length === 0) break;

      for (const product of products) {
        await turso.execute({
          sql: `INSERT INTO products (shoptet_id, name, slug, brand, category, price, price_before_discount, stock, ean, sku, images, visibility, synced_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())
                ON CONFLICT(shoptet_id) DO UPDATE SET
                name=excluded.name, slug=excluded.slug, brand=excluded.brand, category=excluded.category,
                price=excluded.price, price_before_discount=excluded.price_before_discount,
                stock=excluded.stock, ean=excluded.ean, sku=excluded.sku, images=excluded.images,
                visibility=excluded.visibility, synced_at=unixepoch(), updated_at=unixepoch()`,
          args: [
            product.guid, product.name, product.slug || null,
            product.brand?.name || null, product.defaultCategory?.name || null,
            product.variant?.price || 0, product.variant?.priceBeforeDiscount || null,
            product.variant?.stock || 0, product.variant?.ean || null,
            product.variant?.code || null, JSON.stringify(product.images || []),
            product.visibility || 'visible',
          ],
        });
        totalSynced++;
      }

      if (products.length < 100) break;
      page++;
    } catch (error) {
      console.error(`Error syncing products page ${page}:`, error);
      break;
    }
  }

  return { synced: totalSynced };
}
