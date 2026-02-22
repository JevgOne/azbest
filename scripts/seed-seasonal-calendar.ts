import { createClient } from '@libsql/client';

const events = [
  { name: 'Lyžařská sezóna', type: 'sport_season', start: '2025-11-15', end: '2026-03-31', categories: ['lyže', 'snowboard', 'zimní oblečení'], priority: 'high' },
  { name: 'Běžecká sezóna', type: 'sport_season', start: '2026-03-01', end: '2026-10-31', categories: ['běžecké boty', 'běžecké oblečení'], priority: 'high' },
  { name: 'Cyklistická sezóna', type: 'sport_season', start: '2026-04-01', end: '2026-10-15', categories: ['cyklistika', 'helmy', 'brýle'], priority: 'high' },
  { name: 'Valentýn', type: 'holiday', start: '2026-02-01', end: '2026-02-14', categories: ['dárkové balení'], priority: 'medium' },
  { name: 'Velikonoce', type: 'holiday', start: '2026-03-28', end: '2026-04-06', categories: ['outdoor'], priority: 'medium' },
  { name: 'Black Friday', type: 'sale', start: '2026-11-23', end: '2026-11-30', categories: ['všechny'], priority: 'critical' },
  { name: 'Vánoce', type: 'holiday', start: '2026-12-01', end: '2026-12-24', categories: ['dárky', 'dárkové poukazy'], priority: 'critical' },
  { name: 'Letní výprodej', type: 'sale', start: '2026-07-01', end: '2026-08-15', categories: ['letní kolekce'], priority: 'high' },
  { name: 'Zimní výprodej', type: 'sale', start: '2026-01-10', end: '2026-02-28', categories: ['zimní kolekce'], priority: 'high' },
  { name: 'Pražský maraton', type: 'event', start: '2026-05-03', end: '2026-05-03', categories: ['běh', 'ON Running', 'Mizuno'], priority: 'medium' },
  { name: 'UTMB (Ultra-Trail)', type: 'event', start: '2026-08-24', end: '2026-08-30', categories: ['trail running', 'outdoor'], priority: 'medium' },
  { name: 'Zahájení školního roku', type: 'event', start: '2026-08-25', end: '2026-09-15', categories: ['sportovní oblečení', 'batohy'], priority: 'medium' },
];

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) { console.error('Missing env vars'); process.exit(1); }

  const client = createClient({ url: url.trim(), authToken: authToken.trim() });

  for (const event of events) {
    try {
      await client.execute({
        sql: `INSERT OR IGNORE INTO seasonal_events (name, type, start_date, end_date, categories, priority, status) VALUES (?, ?, ?, ?, ?, ?, 'planned')`,
        args: [event.name, event.type, event.start, event.end, JSON.stringify(event.categories), event.priority],
      });
      console.log(`  Added: ${event.name}`);
    } catch (error: any) {
      console.error(`  Error: ${event.name} - ${error.message}`);
    }
  }

  console.log('Seasonal calendar seeded!');
  process.exit(0);
}

main().catch(console.error);
