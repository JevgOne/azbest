import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const result = await turso.execute({
      sql: 'SELECT * FROM customer_segments ORDER BY segment_name ASC',
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
    const { turso } = await import('@/lib/turso');

    // Run RFM segmentation on customer orders
    const ordersResult = await turso.execute({
      sql: `SELECT customer_email, COUNT(*) as frequency, SUM(total_price) as monetary,
            MAX(created_at) as last_order
            FROM orders WHERE customer_email IS NOT NULL
            GROUP BY customer_email`,
      args: [],
    });

    const now = Date.now() / 1000;
    const segments: Record<string, number> = {
      champions: 0,
      loyal: 0,
      potential: 0,
      new_customers: 0,
      at_risk: 0,
      lost: 0,
    };

    for (const row of ordersResult.rows as any[]) {
      const recencyDays = (now - (row.last_order || 0)) / 86400;
      const frequency = row.frequency || 0;
      const monetary = row.monetary || 0;

      let segment: string;
      if (recencyDays < 30 && frequency >= 5 && monetary >= 5000) segment = 'champions';
      else if (recencyDays < 60 && frequency >= 3) segment = 'loyal';
      else if (recencyDays < 30 && frequency <= 2) segment = 'new_customers';
      else if (recencyDays < 90 && frequency >= 2) segment = 'potential';
      else if (recencyDays < 180) segment = 'at_risk';
      else segment = 'lost';

      segments[segment]++;
    }

    // Store segmentation results
    for (const [segmentName, count] of Object.entries(segments)) {
      await turso.execute({
        sql: `INSERT INTO customer_segments (segment_name, customer_count, updated_at)
              VALUES (?, ?, unixepoch())
              ON CONFLICT(segment_name) DO UPDATE SET customer_count=excluded.customer_count, updated_at=unixepoch()`,
        args: [segmentName, count],
      });
    }

    return NextResponse.json({ success: true, data: { segments, totalCustomers: ordersResult.rows.length } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
