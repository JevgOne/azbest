import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const { generateHeurekaFeedXml } = await import('@/lib/heureka/feed');
    const result = await turso.execute({ sql: 'SELECT * FROM products WHERE visibility = ? LIMIT 5000', args: ['visible'] });
    const xml = generateHeurekaFeedXml(result.rows as any[]);
    return new NextResponse(xml, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
