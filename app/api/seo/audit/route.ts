import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';
import { logActivity } from '@/lib/activity-log';

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    // Fetch the page and analyze
    const response = await fetch(url);
    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
    const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
    const imgWithoutAlt = (html.match(/<img(?![^>]*alt=)[^>]*>/gi) || []).length;
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["'](.*?)["']/i);

    const audit = {
      url,
      title: titleMatch?.[1] || null,
      titleLength: titleMatch?.[1]?.length || 0,
      metaDescription: metaDescMatch?.[1] || null,
      metaDescriptionLength: metaDescMatch?.[1]?.length || 0,
      h1Count: h1Matches.length,
      imagesWithoutAlt: imgWithoutAlt,
      hasCanonical: !!canonicalMatch,
      canonicalUrl: canonicalMatch?.[1] || null,
      statusCode: response.status,
      auditedAt: new Date().toISOString(),
    };

    await logActivity({
      userId: user.id, userEmail: user.email, userName: user.name,
      action: 'seo_audit_run', entityType: 'seo',
      details: `SEO audit for ${url}`,
    }).catch(() => {});

    return NextResponse.json({ success: true, data: audit });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
