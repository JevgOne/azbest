import { createClient } from '@libsql/client';

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) { console.error('Missing env vars'); process.exit(1); }

  console.log('Starting full Shoptet sync...');
  console.log('This script requires the app to be running.');
  console.log('Use the admin panel at /admin/shoptet/sync to trigger sync.');

  // In production, this would call the Shoptet API directly
  // For now, it's a placeholder that can be extended
  console.log('To sync, run the app and use the sync panel.');
  process.exit(0);
}

main().catch(console.error);
