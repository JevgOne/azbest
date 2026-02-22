import { heurekaRequest } from './client';

export async function syncHeurekaReviews() {
  try {
    const data = await heurekaRequest<any>('/shop/reviews', { shopId: process.env.HEUREKA_SHOP_ID || '' });
    const { turso } = await import('@/lib/turso');
    let synced = 0;
    for (const review of (data.reviews || [])) {
      await turso.execute({
        sql: `INSERT INTO reviews (source, external_id, author_name, rating, text, pros, cons, published_at)
              VALUES ('heureka', ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(source, external_id) DO UPDATE SET rating=excluded.rating, text=excluded.text`,
        args: [review.id, review.author || null, review.rating, review.summary || null, review.pros || null, review.cons || null, review.unix_timestamp || null],
      });
      synced++;
    }
    return { synced };
  } catch (error) {
    console.error('Error syncing Heureka reviews:', error);
    return { synced: 0, error: (error as any).message };
  }
}
