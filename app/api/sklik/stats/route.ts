import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const campaignIds = searchParams.get('campaignIds')?.split(',').map(Number) || [];
    const dateFrom = searchParams.get('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = searchParams.get('dateTo') || new Date().toISOString().split('T')[0];

    if (campaignIds.length === 0) {
      return NextResponse.json({ success: false, error: 'campaignIds is required' }, { status: 400 });
    }

    const { getSklikStats } = await import('@/lib/sklik/client');
    const stats = await getSklikStats(campaignIds, dateFrom, dateTo);
    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
