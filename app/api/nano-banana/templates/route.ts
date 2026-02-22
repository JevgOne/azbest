import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const result = await turso.execute({ sql: 'SELECT * FROM image_prompt_templates ORDER BY name ASC', args: [] });
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    // Return default templates if table doesn't exist yet
    const defaultTemplates = [
      { id: 1, name: 'Product Banner', prompt: 'Professional product photography of {product}, white background, studio lighting, e-commerce style', category: 'product' },
      { id: 2, name: 'Social Media Post', prompt: 'Eye-catching social media graphic for {product}, vibrant colors, modern design, sports theme', category: 'social' },
      { id: 3, name: 'Sale Banner', prompt: 'Sale promotion banner, bold text saying SLEVA, sporty design, red and white colors, Czech sports equipment', category: 'promotion' },
      { id: 4, name: 'Blog Header', prompt: 'Blog header image about {topic}, professional photography, sports and outdoor activities, Czech Republic', category: 'blog' },
      { id: 5, name: 'Email Header', prompt: 'Email newsletter header, minimalist design, qsport branding, sports equipment, clean and modern', category: 'email' },
    ];
    return NextResponse.json({ success: true, data: defaultTemplates });
  }
}
