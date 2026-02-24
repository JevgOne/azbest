import { genviralRequest } from './client';
import type { GenViralAccount } from '@/types/genviral';

export async function getAccounts(): Promise<GenViralAccount[]> {
  const response = await genviralRequest<{ data: GenViralAccount[] }>('/accounts');
  return response.data;
}

export async function syncAccounts(): Promise<{ synced: number }> {
  const accounts = await getAccounts();
  const { turso } = await import('@/lib/turso');

  for (const account of accounts) {
    await turso.execute({
      sql: `INSERT INTO genviral_accounts (genviral_id, platform, username, display_name, profile_image_url, connected, synced_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())
            ON CONFLICT(genviral_id) DO UPDATE SET
              username = excluded.username,
              display_name = excluded.display_name,
              profile_image_url = excluded.profile_image_url,
              connected = excluded.connected,
              synced_at = unixepoch(),
              updated_at = unixepoch()`,
      args: [
        account.id,
        account.platform,
        account.username,
        account.display_name || null,
        account.profile_image_url || null,
        account.connected ? 1 : 0,
      ],
    });
  }

  return { synced: accounts.length };
}
