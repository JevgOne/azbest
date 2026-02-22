import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    const response = await fetch(url);
    const html = await response.text();

    // Extract meta tags
    const metaTags: Record<string, string | null> = {};
    const metaRegex = /<meta[^>]*(?:name|property)=["']([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>/gi;
    let match;
    while ((match = metaRegex.exec(html)) !== null) {
      metaTags[match[1]] = match[2];
    }

    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch?.[1] || null;

    const analysis = {
      url,
      title,
      titleLength: title?.length || 0,
      titleOk: (title?.length || 0) >= 30 && (title?.length || 0) <= 60,
      description: metaTags['description'] || null,
      descriptionLength: metaTags['description']?.length || 0,
      descriptionOk: (metaTags['description']?.length || 0) >= 120 && (metaTags['description']?.length || 0) <= 160,
      ogTitle: metaTags['og:title'] || null,
      ogDescription: metaTags['og:description'] || null,
      ogImage: metaTags['og:image'] || null,
      twitterCard: metaTags['twitter:card'] || null,
      robots: metaTags['robots'] || null,
      allMetaTags: metaTags,
    };

    return NextResponse.json({ success: true, data: analysis });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
