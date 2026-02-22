import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const result = await turso.execute({ sql: 'SELECT * FROM brand_guide ORDER BY section_order ASC', args: [] });

    if (result.rows.length === 0) {
      // Return default brand guide
      const defaultGuide = {
        brand: 'QSport',
        tagline: 'Sportovni vybaveni pro kazdeho',
        colors: {
          primary: '#E31837',
          secondary: '#1A1A2E',
          accent: '#F5A623',
          background: '#FFFFFF',
          text: '#333333',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        tone: 'Professional, energetic, approachable',
        logoUsage: 'Always use the official QSport logo with proper spacing',
      };
      return NextResponse.json({ success: true, data: defaultGuide });
    }

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
