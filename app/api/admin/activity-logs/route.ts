import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';
import { getActivityLogs } from '@/lib/activity-log';
import type { ActionType, EntityType } from '@/lib/activity-log';

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const action = searchParams.get('action') as ActionType | null;
  const userId = searchParams.get('userId') || undefined;
  const entityType = searchParams.get('entityType') as EntityType | null;

  const result = await getActivityLogs({
    limit,
    offset,
    ...(action ? { action } : {}),
    ...(userId ? { userId } : {}),
    ...(entityType ? { entityType } : {}),
  });
  return NextResponse.json({ success: true, data: result });
}
