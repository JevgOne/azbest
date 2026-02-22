import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!url || !authToken || !email || !password) {
    console.error('Missing required environment variables: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, ADMIN_EMAIL, ADMIN_PASSWORD');
    process.exit(1);
  }

  const client = createClient({ url: url.trim(), authToken: authToken.trim() });
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await client.execute({
      sql: `INSERT INTO admins (id, email, name, password_hash, role, active, created_at, updated_at)
            VALUES ('admin-1', ?, 'Owner', ?, 'owner', 1, unixepoch(), unixepoch())
            ON CONFLICT(id) DO UPDATE SET email=excluded.email, password_hash=excluded.password_hash, updated_at=unixepoch()`,
      args: [email, passwordHash],
    });
    console.log(`Owner account created/updated: ${email}`);
  } catch (error: any) {
    console.error('Error:', error.message);
  }

  process.exit(0);
}

main().catch(console.error);
