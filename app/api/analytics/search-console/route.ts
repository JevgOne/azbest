import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const siteUrl = searchParams.get('siteUrl') || process.env.SEARCH_CONSOLE_SITE_URL || 'sc-domain:qsport.cz';
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    const { getSearchConsoleOverview, getTopQueries, getTopPages } = await import('@/lib/google-search-console');

    const [overview, topQueries, topPages] = await Promise.all([
      getSearchConsoleOverview(siteUrl, startDate, endDate),
      getTopQueries(siteUrl, startDate, endDate),
      getTopPages(siteUrl, startDate, endDate),
    ]);

    return NextResponse.json({ success: true, data: { overview, topQueries, topPages } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
