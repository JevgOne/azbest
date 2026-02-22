import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { subscription, userAgent } = await request.json();
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ success: false, error: 'Subscription data is required' }, { status: 400 });
    }

    const { turso } = await import('@/lib/turso');
    await turso.execute({
      sql: `INSERT INTO push_subscriptions (endpoint, subscription_json, user_agent, active, created_at)
            VALUES (?, ?, ?, 1, unixepoch())
            ON CONFLICT(endpoint) DO UPDATE SET subscription_json=excluded.subscription_json, active=1`,
      args: [subscription.endpoint, JSON.stringify(subscription), userAgent || null],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
