import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, AdminUser } from './simple-auth';

export async function getAuthUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin-session')?.value;
  if (!sessionToken) return null;
  return verifySessionToken(sessionToken);
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}
