import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';
    const { getGA4Overview, getGA4TopPages, getGA4TrafficSources } = await import('@/lib/google-analytics');

    const [overview, topPages, trafficSources] = await Promise.all([
      getGA4Overview(startDate, endDate),
      getGA4TopPages(startDate, endDate),
      getGA4TrafficSources(startDate, endDate),
    ]);

    return NextResponse.json({ success: true, data: { overview, topPages, trafficSources } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
