export type ActionType =
  | 'user_created' | 'user_updated' | 'user_deleted'
  | 'user_login' | 'user_logout'
  | 'settings_updated' | 'password_changed'
  | 'shoptet_sync' | 'product_updated' | 'order_updated'
  | 'campaign_created' | 'campaign_updated' | 'campaign_paused'
  | 'email_sent' | 'push_sent' | 'sms_sent'
  | 'social_post_created' | 'social_post_scheduled' | 'social_post_published' | 'social_post_retried' | 'social_analytics_synced'
  | 'blog_created' | 'blog_updated' | 'blog_deleted'
  | 'image_generated' | 'report_generated'
  | 'promo_code_created' | 'review_synced'
  | 'seo_audit_run' | 'keyword_tracked'
  | 'ads_synced' | 'ads_sync_failed' | 'ads_roas_calculated';

export type EntityType =
  | 'user' | 'settings' | 'product' | 'order' | 'customer'
  | 'campaign' | 'email' | 'push' | 'sms'
  | 'social_post' | 'blog' | 'image' | 'report'
  | 'promo_code' | 'review' | 'seo' | 'keyword'
  | 'ad_sync' | 'ad_campaign';

export interface ActivityLog {
  id: number;
  user_id: string;
  user_email: string;
  user_name: string | null;
  action: ActionType;
  entity_type: EntityType | null;
  entity_id: string | null;
  entity_name: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: number;
}

export interface LogActivityParams {
  userId: string;
  userEmail: string;
  userName?: string;
  action: ActionType;
  entityType?: EntityType;
  entityId?: string;
  entityName?: string;
  details?: string;
  ipAddress?: string;
}

export async function logActivity(params: LogActivityParams): Promise<boolean> {
  try {
    const { turso } = await import('@/lib/turso');
    await turso.execute({
      sql: `INSERT INTO activity_logs
            (user_id, user_email, user_name, action, entity_type, entity_id, entity_name, details, ip_address, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`,
      args: [
        params.userId, params.userEmail, params.userName || null,
        params.action, params.entityType || null, params.entityId || null,
        params.entityName || null, params.details || null, params.ipAddress || null,
      ],
    });
    return true;
  } catch (error) {
    console.error('Failed to log activity:', error);
    return false;
  }
}

export async function getActivityLogs(options: {
  limit?: number; offset?: number; userId?: string;
  action?: ActionType; entityType?: EntityType;
}): Promise<{ logs: ActivityLog[]; total: number }> {
  try {
    const { turso } = await import('@/lib/turso');
    const { limit = 50, offset = 0, userId, action, entityType } = options;
    const conditions: string[] = [];
    const args: any[] = [];
    if (userId) { conditions.push('user_id = ?'); args.push(userId); }
    if (action) { conditions.push('action = ?'); args.push(action); }
    if (entityType) { conditions.push('entity_type = ?'); args.push(entityType); }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await turso.execute({
      sql: `SELECT COUNT(*) as count FROM activity_logs ${whereClause}`,
      args,
    });
    const total = (countResult.rows[0] as any)?.count || 0;
    const result = await turso.execute({
      sql: `SELECT * FROM activity_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    });
    return { logs: result.rows as unknown as ActivityLog[], total };
  } catch (error) {
    console.error('Failed to get activity logs:', error);
    return { logs: [], total: 0 };
  }
}

export async function getRecentActivity(limit: number = 10): Promise<ActivityLog[]> {
  const { logs } = await getActivityLogs({ limit });
  return logs;
}

export const ACTION_LABELS: Record<ActionType, string> = {
  user_created: 'Vytvořil uživatele',
  user_updated: 'Upravil uživatele',
  user_deleted: 'Smazal uživatele',
  user_login: 'Přihlásil se',
  user_logout: 'Odhlásil se',
  settings_updated: 'Změnil nastavení',
  password_changed: 'Změnil heslo',
  shoptet_sync: 'Synchronizace Shoptet',
  product_updated: 'Aktualizace produktu',
  order_updated: 'Aktualizace objednávky',
  campaign_created: 'Vytvořil kampaň',
  campaign_updated: 'Upravil kampaň',
  campaign_paused: 'Pozastavil kampaň',
  email_sent: 'Odeslal email',
  push_sent: 'Odeslal push notifikaci',
  sms_sent: 'Odeslal SMS',
  social_post_created: 'Vytvořil příspěvek',
  social_post_scheduled: 'Naplánoval příspěvek',
  social_post_published: 'Publikoval příspěvek',
  social_post_retried: 'Opakoval příspěvek',
  social_analytics_synced: 'Synchronizoval analytiku',
  blog_created: 'Vytvořil článek',
  blog_updated: 'Upravil článek',
  blog_deleted: 'Smazal článek',
  image_generated: 'Vygeneroval obrázek',
  report_generated: 'Vygeneroval report',
  promo_code_created: 'Vytvořil promo kód',
  review_synced: 'Synchronizoval recenze',
  seo_audit_run: 'Spustil SEO audit',
  keyword_tracked: 'Sledoval klíčové slovo',
  ads_synced: 'Synchronizoval reklamy',
  ads_sync_failed: 'Chyba synchronizace reklam',
  ads_roas_calculated: 'Přepočítal ROAS',
};
