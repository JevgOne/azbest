import { NextResponse } from 'next/server';
import { verifyAdminCredentials, generateSessionToken } from '@/lib/auth/simple-auth';
import { logActivity } from '@/lib/activity-log';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email a heslo jsou povinné' },
        { status: 400 }
      );
    }

    const user = await verifyAdminCredentials(email, password);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Neplatné přihlašovací údaje' },
        { status: 401 }
      );
    }

    const token = generateSessionToken(user);

    await logActivity({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'user_login',
      entityType: 'user',
      entityId: user.id,
    }).catch(() => {});

    const response = NextResponse.json({ success: true, user });
    response.cookies.set('admin-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Interní chyba serveru' },
      { status: 500 }
    );
  }
}
