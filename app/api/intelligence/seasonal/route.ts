import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    const result = await turso.execute({
      sql: 'SELECT * FROM seasonal_events WHERE year = ? ORDER BY start_date ASC',
      args: [year],
    });

    if (result.rows.length === 0) {
      // Return default seasonal events for Czech sports market
      const defaults = [
        { name: 'Novorocni slevy', start_date: `${year}-01-01`, end_date: `${year}-01-15`, category: 'sale', description: 'Post-holiday sales' },
        { name: 'Valentyn', start_date: `${year}-02-01`, end_date: `${year}-02-14`, category: 'holiday', description: 'Valentine gifts campaign' },
        { name: 'Jarni sezona', start_date: `${year}-03-01`, end_date: `${year}-04-30`, category: 'season', description: 'Spring outdoor sports launch' },
        { name: 'Letni sezona', start_date: `${year}-05-01`, end_date: `${year}-08-31`, category: 'season', description: 'Summer sports peak' },
        { name: 'Zpet do skoly', start_date: `${year}-08-15`, end_date: `${year}-09-15`, category: 'campaign', description: 'Back to school sports' },
        { name: 'Black Friday', start_date: `${year}-11-20`, end_date: `${year}-11-30`, category: 'sale', description: 'Black Friday / Cyber Monday' },
        { name: 'Vanoce', start_date: `${year}-12-01`, end_date: `${year}-12-24`, category: 'holiday', description: 'Christmas gift season' },
        { name: 'Zimni sezona', start_date: `${year}-11-01`, end_date: `${year}-02-28`, category: 'season', description: 'Winter sports (ski, snowboard)' },
      ];
      return NextResponse.json({ success: true, data: defaults });
    }

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
