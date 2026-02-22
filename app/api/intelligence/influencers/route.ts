import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const result = await turso.execute({
      sql: 'SELECT * FROM influencers ORDER BY name ASC',
      args: [],
    });
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { name, platform, handle, followers, engagementRate, category, contactEmail, notes } = await request.json();
    if (!name || !platform) {
      return NextResponse.json({ success: false, error: 'Name and platform are required' }, { status: 400 });
    }

    const { turso } = await import('@/lib/turso');
    await turso.execute({
      sql: `INSERT INTO influencers (name, platform, handle, followers, engagement_rate, category, contact_email, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
      args: [name, platform, handle || null, followers || null, engagementRate || null, category || null, contactEmail || null, notes || null],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
