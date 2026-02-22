import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'LAST_30_DAYS';
    const { getCampaignPerformance } = await import('@/lib/google-ads');
    const campaigns = await getCampaignPerformance(dateRange);
    return NextResponse.json({ success: true, data: campaigns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
