import { getPost } from './posts';

export async function syncPostAnalytics(genviralPostId: string, socialPostId: number): Promise<void> {
  const post = await getPost(genviralPostId);
  const { turso } = await import('@/lib/turso');

  for (const state of post.account_states) {
    if (state.status === 'published') {
      await turso.execute({
        sql: `INSERT INTO genviral_analytics (social_post_id, genviral_account_id, platform, views, likes, comments, shares, fetched_at)
              VALUES (?, ?, ?, 0, 0, 0, 0, unixepoch())`,
        args: [socialPostId, state.account_id, state.platform],
      });
    }
  }

  // Update aggregate stats on social_posts
  const analyticsResult = await turso.execute({
    sql: `SELECT SUM(views) as total_views, SUM(likes) as total_likes, SUM(comments) as total_comments, SUM(shares) as total_shares
          FROM genviral_analytics WHERE social_post_id = ?`,
    args: [socialPostId],
  });

  if (analyticsResult.rows.length > 0) {
    const row = analyticsResult.rows[0] as any;
    await turso.execute({
      sql: `UPDATE social_posts SET likes = ?, comments = ?, shares = ?, impressions = ?, updated_at = unixepoch() WHERE id = ?`,
      args: [row.total_likes || 0, row.total_comments || 0, row.total_shares || 0, row.total_views || 0, socialPostId],
    });
  }
}

export async function syncAllAnalytics(): Promise<{ synced: number }> {
  const { turso } = await import('@/lib/turso');
  const result = await turso.execute({
    sql: `SELECT id, external_id FROM social_posts WHERE external_id IS NOT NULL AND status = 'published'`,
    args: [],
  });

  let synced = 0;
  for (const row of result.rows) {
    try {
      await syncPostAnalytics((row as any).external_id, (row as any).id);
      synced++;
    } catch (error) {
      console.error(`Failed to sync analytics for post ${(row as any).id}:`, error);
    }
  }

  return { synced };
}
