import { createClient } from '@libsql/client';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
    process.exit(1);
  }

  const client = createClient({ url: url.trim(), authToken: authToken.trim() });

  const migrationsDir = path.join(process.cwd(), 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  console.log(`Running ${files.length} migrations...`);

  for (const file of files) {
    console.log(`  Running: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await client.execute(statement);
      } catch (error: any) {
        if (!error.message?.includes('already exists')) {
          console.error(`  Error in ${file}: ${error.message}`);
        }
      }
    }
  }

  console.log('All migrations completed!');
  process.exit(0);
}

main().catch(console.error);
