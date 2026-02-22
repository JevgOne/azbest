import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';
import { logActivity } from '@/lib/activity-log';

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    let sql = 'SELECT * FROM promo_codes';
    const args: any[] = [];
    if (active === 'true') {
      sql += ' WHERE active = 1 AND (expires_at IS NULL OR expires_at > unixepoch())';
    } else if (active === 'false') {
      sql += ' WHERE active = 0 OR (expires_at IS NOT NULL AND expires_at <= unixepoch())';
    }
    sql += ' ORDER BY created_at DESC';

    const result = await turso.execute({ sql, args });
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { code, discountType, discountValue, minOrderValue, maxUses, expiresAt, description } = await request.json();
    if (!code || !discountType || !discountValue) {
      return NextResponse.json({ success: false, error: 'Code, discountType, and discountValue are required' }, { status: 400 });
    }

    const { turso } = await import('@/lib/turso');
    await turso.execute({
      sql: `INSERT INTO promo_codes (code, discount_type, discount_value, min_order_value, max_uses, uses_count, expires_at, description, active, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, 0, ?, ?, 1, ?, unixepoch())`,
      args: [code.toUpperCase(), discountType, discountValue, minOrderValue || null, maxUses || null, expiresAt || null, description || null, user.email],
    });

    await logActivity({
      userId: user.id, userEmail: user.email, userName: user.name,
      action: 'promo_code_created', entityType: 'promo_code', entityName: code,
      details: `Created promo code: ${code} (${discountType} ${discountValue})`,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
