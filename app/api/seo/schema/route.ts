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

    // Extract JSON-LD structured data
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    const schemas: any[] = [];
    let match;
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        schemas.push(JSON.parse(match[1]));
      } catch {
        // Skip invalid JSON-LD
      }
    }

    // Check for microdata
    const hasMicrodata = /<[^>]*itemscope[^>]*itemtype=["']https?:\/\/schema\.org/i.test(html);

    const analysis = {
      url,
      jsonLdSchemas: schemas,
      jsonLdCount: schemas.length,
      hasMicrodata,
      schemaTypes: schemas.map((s: any) => s['@type']).filter(Boolean),
      hasProduct: schemas.some((s: any) => s['@type'] === 'Product'),
      hasOrganization: schemas.some((s: any) => s['@type'] === 'Organization'),
      hasBreadcrumb: schemas.some((s: any) => s['@type'] === 'BreadcrumbList'),
      hasLocalBusiness: schemas.some((s: any) => s['@type'] === 'LocalBusiness'),
    };

    return NextResponse.json({ success: true, data: analysis });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
