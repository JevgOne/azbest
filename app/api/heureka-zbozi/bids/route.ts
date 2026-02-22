import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const result = await turso.execute({ sql: 'SELECT * FROM heureka_bids ORDER BY updated_at DESC', args: [] });
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { productId, maxCpc, platform } = await request.json();
    if (!productId || !maxCpc) {
      return NextResponse.json({ success: false, error: 'productId and maxCpc are required' }, { status: 400 });
    }

    const { turso } = await import('@/lib/turso');
    await turso.execute({
      sql: `INSERT INTO heureka_bids (product_id, max_cpc, platform, updated_at)
            VALUES (?, ?, ?, unixepoch())
            ON CONFLICT(product_id, platform) DO UPDATE SET max_cpc=excluded.max_cpc, updated_at=unixepoch()`,
      args: [productId, maxCpc, platform || 'heureka'],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
