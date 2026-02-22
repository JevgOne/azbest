import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const campaignId = parseInt(searchParams.get('campaignId') || '0');
    if (!campaignId) {
      return NextResponse.json({ success: false, error: 'campaignId is required' }, { status: 400 });
    }
    const { getSklikKeywords } = await import('@/lib/sklik/client');
    const keywords = await getSklikKeywords(campaignId);
    return NextResponse.json({ success: true, data: keywords });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
