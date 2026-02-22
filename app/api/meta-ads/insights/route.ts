import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const datePreset = searchParams.get('datePreset') || 'last_30d';
    const { getCampaignInsights } = await import('@/lib/meta-ads');
    const insights = await getCampaignInsights(datePreset);
    return NextResponse.json({ success: true, data: insights });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
