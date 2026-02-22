import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await turso.execute({
      sql: 'SELECT * FROM utm_campaigns ORDER BY created_at DESC LIMIT ? OFFSET ?',
      args: [limit, offset],
    });
    const countResult = await turso.execute({ sql: 'SELECT COUNT(*) as count FROM utm_campaigns', args: [] });

    return NextResponse.json({
      success: true,
      data: { campaigns: result.rows, total: (countResult.rows[0] as any)?.count || 0 },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { name, baseUrl, source, medium, campaign, term, content } = await request.json();
    if (!name || !baseUrl || !source || !medium || !campaign) {
      return NextResponse.json({ success: false, error: 'Name, baseUrl, source, medium, and campaign are required' }, { status: 400 });
    }

    // Build UTM URL
    const url = new URL(baseUrl);
    url.searchParams.set('utm_source', source);
    url.searchParams.set('utm_medium', medium);
    url.searchParams.set('utm_campaign', campaign);
    if (term) url.searchParams.set('utm_term', term);
    if (content) url.searchParams.set('utm_content', content);
    const fullUrl = url.toString();

    const { turso } = await import('@/lib/turso');
    await turso.execute({
      sql: `INSERT INTO utm_campaigns (name, base_url, utm_source, utm_medium, utm_campaign, utm_term, utm_content, full_url, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`,
      args: [name, baseUrl, source, medium, campaign, term || null, content || null, fullUrl, user.email],
    });

    return NextResponse.json({ success: true, data: { fullUrl } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
