import { turso, parseJSON, stringifyJSON } from '@/lib/turso';
import { createPost } from '@/lib/genviral/posts';
import { generateProductCaption, type ProductForCaption } from '@/lib/anthropic';
import { logActivity } from '@/lib/activity-log';
import type { Product } from '@/types/product';

// ─── Types ───────────────────────────────────────────────────────

export interface AutoPostRules {
  newProducts?: boolean;
  onSale?: boolean;
  highStock?: boolean;
  stockThreshold?: number;
}

export interface AutoPostConfig {
  id: number;
  enabled: boolean;
  rules: AutoPostRules;
  accountIds: string[];
  captionPrompt: string | null;
  postTime: string;
  createdAt: number;
  updatedAt: number;
}

export interface AutoPostResult {
  success: boolean;
  productId?: number;
  productName?: string;
  caption?: string;
  genviralPostId?: string;
  error?: string;
  source: 'auto' | 'manual_queue' | 'manual_trigger';
}

// ─── Config ──────────────────────────────────────────────────────

export async function getAutoPostConfig(): Promise<AutoPostConfig | null> {
  const result = await turso.execute({
    sql: 'SELECT * FROM auto_post_config ORDER BY id DESC LIMIT 1',
    args: [],
  });
  if (result.rows.length === 0) return null;
  const row = result.rows[0] as any;
  return {
    id: row.id,
    enabled: row.enabled === 1,
    rules: parseJSON<AutoPostRules>(row.rules) || {},
    accountIds: parseJSON<string[]>(row.account_ids) || [],
    captionPrompt: row.caption_prompt,
    postTime: row.post_time || '10:00',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function saveAutoPostConfig(config: Partial<AutoPostConfig>): Promise<void> {
  const existing = await getAutoPostConfig();
  if (existing) {
    await turso.execute({
      sql: `UPDATE auto_post_config SET
        enabled = ?, rules = ?, account_ids = ?, caption_prompt = ?, post_time = ?, updated_at = unixepoch()
        WHERE id = ?`,
      args: [
        config.enabled !== undefined ? (config.enabled ? 1 : 0) : (existing.enabled ? 1 : 0),
        stringifyJSON(config.rules !== undefined ? config.rules : existing.rules) || '{}',
        stringifyJSON(config.accountIds !== undefined ? config.accountIds : existing.accountIds) || '[]',
        config.captionPrompt !== undefined ? config.captionPrompt : existing.captionPrompt,
        config.postTime || existing.postTime,
        existing.id,
      ],
    });
  } else {
    await turso.execute({
      sql: `INSERT INTO auto_post_config (enabled, rules, account_ids, caption_prompt, post_time)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        config.enabled ? 1 : 0,
        stringifyJSON(config.rules) || '{}',
        stringifyJSON(config.accountIds) || '[]',
        config.captionPrompt || null,
        config.postTime || '10:00',
      ],
    });
  }
}

// ─── Product Selection ───────────────────────────────────────────

export async function selectProduct(rules: AutoPostRules): Promise<Product | null> {
  // 1. Check manual queue first
  const queueResult = await turso.execute({
    sql: `SELECT q.id as queue_id, p.* FROM auto_post_queue q
          JOIN products p ON p.id = q.product_id
          WHERE q.status = 'pending'
          ORDER BY q.priority DESC, q.created_at ASC
          LIMIT 1`,
    args: [],
  });

  if (queueResult.rows.length > 0) {
    const row = queueResult.rows[0] as any;
    // Mark queue item as posted
    await turso.execute({
      sql: `UPDATE auto_post_queue SET status = 'posted' WHERE id = ?`,
      args: [row.queue_id],
    });
    return rowToProduct(row);
  }

  // 2. Auto-select based on rules
  const conditions: string[] = ['p.visibility = ?'];
  const args: any[] = ['visible'];

  // Exclude already posted products (last 30 days)
  conditions.push(`p.id NOT IN (
    SELECT product_id FROM auto_post_history
    WHERE created_at > unixepoch() - 2592000
  )`);

  if (rules.onSale) {
    conditions.push(`(p.price_before_discount IS NOT NULL AND p.price_before_discount > p.price)`);
  }

  if (rules.highStock && rules.stockThreshold) {
    conditions.push(`p.stock >= ?`);
    args.push(rules.stockThreshold);
  }

  // Build ORDER: prefer sale items, then new, then high stock
  let orderBy = 'p.updated_at DESC';
  if (rules.onSale) {
    orderBy = `CASE WHEN p.price_before_discount IS NOT NULL AND p.price_before_discount > p.price THEN 0 ELSE 1 END, p.updated_at DESC`;
  }
  if (rules.newProducts) {
    orderBy = `p.created_at DESC`;
  }

  const query = `SELECT p.* FROM products p
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${orderBy}
    LIMIT 1`;

  const result = await turso.execute({ sql: query, args });
  if (result.rows.length === 0) return null;
  return rowToProduct(result.rows[0] as any);
}

function rowToProduct(row: any): Product {
  return {
    id: row.id,
    shoptet_id: row.shoptet_id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    category: row.category,
    subcategory: row.subcategory,
    price: row.price,
    price_before_discount: row.price_before_discount,
    currency: row.currency,
    stock: row.stock,
    ean: row.ean,
    sku: row.sku,
    weight: row.weight,
    description: row.description,
    short_description: row.short_description,
    images: parseJSON<string[]>(row.images) || [],
    variants: parseJSON<any[]>(row.variants) || [],
    parameters: parseJSON<Record<string, any>>(row.parameters) || {},
    visibility: row.visibility,
    created_at: row.created_at,
    updated_at: row.updated_at,
    synced_at: row.synced_at,
  };
}

// ─── Orchestration ───────────────────────────────────────────────

export async function runAutoPost(
  config: AutoPostConfig,
  source: 'auto' | 'manual_queue' | 'manual_trigger' = 'auto',
): Promise<AutoPostResult> {
  try {
    // 1. Select product
    const product = await selectProduct(config.rules);
    if (!product) {
      return { success: false, error: 'No eligible product found', source };
    }

    if (config.accountIds.length === 0) {
      return { success: false, error: 'No social accounts configured', source };
    }

    // 2. Generate caption
    const shopUrl = `https://www.qsport.cz/${product.slug || product.shoptet_id}`;
    const captionInput: ProductForCaption = {
      name: product.name,
      price: product.price,
      priceBeforeDiscount: product.price_before_discount,
      category: product.category,
      description: product.short_description || product.description,
      url: shopUrl,
    };

    const caption = await generateProductCaption(captionInput, config.captionPrompt);

    // 3. Post via GenViral
    const mediaUrls = product.images.length > 0 ? [product.images[0]] : [];

    const genviralPost = await createPost({
      caption,
      media_urls: mediaUrls,
      account_ids: config.accountIds,
      metadata: {
        source: 'auto_posting',
        product_id: product.id,
        product_name: product.name,
      },
    });

    // 4. Store in social_posts
    await turso.execute({
      sql: `INSERT INTO social_posts (platform, type, content, media_urls, status, external_id, created_at, updated_at)
            VALUES ('instagram', 'post', ?, ?, 'published', ?, unixepoch(), unixepoch())`,
      args: [caption, stringifyJSON(mediaUrls) || '[]', genviralPost.id],
    });

    // 5. Store in auto_post_history
    await turso.execute({
      sql: `INSERT INTO auto_post_history (product_id, product_name, genviral_post_id, caption, account_ids, source, status)
            VALUES (?, ?, ?, ?, ?, ?, 'posted')`,
      args: [
        product.id,
        product.name,
        genviralPost.id,
        caption,
        stringifyJSON(config.accountIds) || '[]',
        source,
      ],
    });

    // 6. Log activity
    await logActivity({
      userId: 'system',
      userEmail: 'auto-posting@system',
      action: 'social_post_published',
      entityType: 'social_post',
      entityId: genviralPost.id,
      entityName: product.name,
      details: `Auto-posted product "${product.name}" to ${config.accountIds.length} account(s)`,
    }).catch(() => {});

    return {
      success: true,
      productId: product.id,
      productName: product.name,
      caption,
      genviralPostId: genviralPost.id,
      source,
    };
  } catch (error: any) {
    // Record failure
    await turso.execute({
      sql: `INSERT INTO auto_post_history (product_id, product_name, caption, account_ids, source, status, error_message)
            VALUES (0, 'unknown', '', '[]', ?, 'failed', ?)`,
      args: [source, error.message],
    }).catch(() => {});

    return { success: false, error: error.message, source };
  }
}

// ─── Queue Operations ────────────────────────────────────────────

export async function addToQueue(productId: number, priority: number = 0): Promise<void> {
  await turso.execute({
    sql: `INSERT INTO auto_post_queue (product_id, priority) VALUES (?, ?)`,
    args: [productId, priority],
  });
}

export async function removeFromQueue(queueId: number): Promise<void> {
  await turso.execute({
    sql: `DELETE FROM auto_post_queue WHERE id = ?`,
    args: [queueId],
  });
}

export async function getQueue() {
  const result = await turso.execute({
    sql: `SELECT q.*, p.name as product_name, p.price, p.images, p.category
          FROM auto_post_queue q
          JOIN products p ON p.id = q.product_id
          WHERE q.status = 'pending'
          ORDER BY q.priority DESC, q.created_at ASC`,
    args: [],
  });
  return result.rows.map((row: any) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    price: row.price,
    images: parseJSON<string[]>(row.images) || [],
    category: row.category,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function getHistory(limit: number = 20, offset: number = 0) {
  const [historyResult, countResult] = await Promise.all([
    turso.execute({
      sql: `SELECT h.*, p.name as product_name_live, p.images as product_images
            FROM auto_post_history h
            LEFT JOIN products p ON p.id = h.product_id
            ORDER BY h.created_at DESC
            LIMIT ? OFFSET ?`,
      args: [limit, offset],
    }),
    turso.execute({
      sql: `SELECT COUNT(*) as count FROM auto_post_history`,
      args: [],
    }),
  ]);

  const total = (countResult.rows[0] as any)?.count || 0;
  const history = historyResult.rows.map((row: any) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name || row.product_name_live || 'Unknown',
    productImages: parseJSON<string[]>(row.product_images) || [],
    genviralPostId: row.genviral_post_id,
    caption: row.caption,
    accountIds: parseJSON<string[]>(row.account_ids) || [],
    source: row.source,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  }));

  return { history, total };
}
