import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { productId, priority } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId is required' }, { status: 400 });
    }

    const { addToQueue } = await import('@/lib/auto-posting');
    await addToQueue(productId, priority || 0);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const queueId = searchParams.get('id');

    if (!queueId) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    const { removeFromQueue } = await import('@/lib/auto-posting');
    await removeFromQueue(Number(queueId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
