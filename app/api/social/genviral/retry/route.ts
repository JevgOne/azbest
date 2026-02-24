import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';
import { logActivity } from '@/lib/activity-log';

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { postIds } = await request.json();
    if (!postIds?.length) {
      return NextResponse.json({ success: false, error: 'postIds required' }, { status: 400 });
    }

    const { retryFailedPosts } = await import('@/lib/genviral/posts');
    const result = await retryFailedPosts(postIds);

    await logActivity({
      userId: user.id, userEmail: user.email, userName: user.name,
      action: 'social_post_retried', entityType: 'social_post',
      details: `Opakoval ${postIds.length} neúspěšný(ch) GenViral příspěvek(ů)`,
    }).catch(() => {});

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
