import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';
import { getAllDbAdmins, createDbAdmin, updateDbAdmin, deleteDbAdmin } from '@/lib/auth/simple-auth';
import { canManageUsers, isOwner } from '@/lib/auth/permissions';
import { logActivity } from '@/lib/activity-log';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  if (!canManageUsers(user.role)) {
    return NextResponse.json({ success: false, error: 'Nedostatečná oprávnění' }, { status: 403 });
  }

  const admins = await getAllDbAdmins();
  return NextResponse.json({ success: true, data: admins });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  if (!canManageUsers(user.role)) {
    return NextResponse.json({ success: false, error: 'Nedostatečná oprávnění' }, { status: 403 });
  }

  try {
    const { email, password, name, role } = await request.json();
    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: 'Email, heslo a jméno jsou povinné' }, { status: 400 });
    }

    const newAdmin = await createDbAdmin(email, password, name, role || 'admin');

    await logActivity({
      userId: user.id, userEmail: user.email, userName: user.name,
      action: 'user_created', entityType: 'user',
      entityId: newAdmin?.id, entityName: name,
    }).catch(() => {});

    return NextResponse.json({ success: true, data: newAdmin });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Chyba' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  if (!canManageUsers(user.role)) {
    return NextResponse.json({ success: false, error: 'Nedostatečná oprávnění' }, { status: 403 });
  }

  try {
    const { id, ...data } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'ID je povinné' }, { status: 400 });

    await updateDbAdmin(id, data);

    await logActivity({
      userId: user.id, userEmail: user.email, userName: user.name,
      action: 'user_updated', entityType: 'user', entityId: id,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Chyba při aktualizaci' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  if (!isOwner(user.role)) {
    return NextResponse.json({ success: false, error: 'Pouze vlastník může mazat uživatele' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'ID je povinné' }, { status: 400 });

  await deleteDbAdmin(id);

  await logActivity({
    userId: user.id, userEmail: user.email, userName: user.name,
    action: 'user_deleted', entityType: 'user', entityId: id,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
