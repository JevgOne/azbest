import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { campaigns } = await request.json();
    const { analyzeMetaAdsCampaigns } = await import('@/lib/meta-ads-analysis');
    const analysis = await analyzeMetaAdsCampaigns(campaigns || []);
    return NextResponse.json({ success: true, data: analysis });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
