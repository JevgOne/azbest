import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';
import { logActivity } from '@/lib/activity-log';

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { getPosts } = await import('@/lib/genviral/posts');
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const status = searchParams.get('status');
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    if (status) params.status = status;

    const result = await getPosts(params);
    return NextResponse.json({ success: true, data: result.data, total: result.total });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { caption, mediaUrls, accountIds, scheduledAt, tiktokPublishMode } = body;

    if (!caption || !accountIds?.length) {
      return NextResponse.json(
        { success: false, error: 'Caption and at least one account are required' },
        { status: 400 }
      );
    }
    if (caption.length < 1 || caption.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Caption must be 1-500 characters' },
        { status: 400 }
      );
    }

    const { createPost } = await import('@/lib/genviral/posts');
    const { turso } = await import('@/lib/turso');

    const genviralPost = await createPost({
      caption,
      media_urls: mediaUrls || [],
      account_ids: accountIds,
      scheduled_at: scheduledAt || undefined,
      tiktok_publish_mode: tiktokPublishMode || undefined,
    });

    // Store in local social_posts table
    const postStatus = scheduledAt ? 'scheduled' : 'draft';
    await turso.execute({
      sql: `INSERT INTO social_posts (platform, type, content, media_urls, status, scheduled_at, external_id, created_at, updated_at)
            VALUES ('tiktok', 'post', ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
      args: [caption, JSON.stringify(mediaUrls || []), postStatus, scheduledAt || null, genviralPost.id],
    });

    // Store per-account states
    if (genviralPost.account_states) {
      for (const state of genviralPost.account_states) {
        await turso.execute({
          sql: `INSERT INTO genviral_post_states (social_post_id, genviral_account_id, platform, status, created_at, updated_at)
                VALUES ((SELECT id FROM social_posts WHERE external_id = ?), ?, ?, ?, unixepoch(), unixepoch())`,
          args: [genviralPost.id, state.account_id, state.platform, state.status],
        });
      }
    }

    await logActivity({
      userId: user.id, userEmail: user.email, userName: user.name,
      action: 'social_post_created', entityType: 'social_post', entityId: genviralPost.id,
      details: `Vytvořil GenViral příspěvek pro ${accountIds.length} účet(ů)`,
    }).catch(() => {});

    return NextResponse.json({ success: true, data: genviralPost });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
