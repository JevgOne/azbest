import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';
import { logActivity } from '@/lib/activity-log';

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    let sql = 'SELECT * FROM blog_posts';
    const args: any[] = [];
    if (status) {
      sql += ' WHERE status = ?';
      args.push(status);
    }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    args.push(limit, offset);

    const result = await turso.execute({ sql, args });
    const countResult = await turso.execute({ sql: 'SELECT COUNT(*) as count FROM blog_posts', args: [] });

    return NextResponse.json({
      success: true,
      data: { posts: result.rows, total: (countResult.rows[0] as any)?.count || 0 },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { title, slug, content, excerpt, featuredImage, status, seoTitle, seoDescription } = await request.json();
    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'Title and content are required' }, { status: 400 });
    }

    const { turso } = await import('@/lib/turso');
    const postSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const postId = `blog_${Date.now()}`;

    await turso.execute({
      sql: `INSERT INTO blog_posts (post_id, title, slug, content, excerpt, featured_image, status, seo_title, seo_description, author_email, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
      args: [postId, title, postSlug, content, excerpt || null, featuredImage || null, status || 'draft', seoTitle || title, seoDescription || excerpt || null, user.email],
    });

    await logActivity({
      userId: user.id, userEmail: user.email, userName: user.name,
      action: 'blog_created', entityType: 'blog', entityId: postId, entityName: title,
    }).catch(() => {});

    return NextResponse.json({ success: true, data: { postId, slug: postSlug } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
