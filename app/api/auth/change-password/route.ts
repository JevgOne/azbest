import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';
import { verifyAdminCredentials, updateDbAdmin } from '@/lib/auth/simple-auth';
import { logActivity } from '@/lib/activity-log';

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Obě hesla jsou povinná' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: 'Heslo musí mít minimálně 8 znaků' }, { status: 400 });
    }

    const verified = await verifyAdminCredentials(user.email, currentPassword);
    if (!verified) {
      return NextResponse.json({ success: false, error: 'Nesprávné aktuální heslo' }, { status: 400 });
    }

    await updateDbAdmin(user.id, { password: newPassword });

    await logActivity({
      userId: user.id, userEmail: user.email, userName: user.name,
      action: 'password_changed', entityType: 'user', entityId: user.id,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Chyba při změně hesla' }, { status: 500 });
  }
}
