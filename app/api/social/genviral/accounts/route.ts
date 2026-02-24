import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { syncAccounts } = await import('@/lib/genviral/accounts');
    const { turso } = await import('@/lib/turso');

    await syncAccounts();

    const result = await turso.execute({
      sql: 'SELECT * FROM genviral_accounts WHERE connected = 1 ORDER BY platform, username',
      args: [],
    });

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
