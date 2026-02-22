export const defaultSeasonalEvents = [
  { name: 'Lyžařská sezóna', type: 'sport_season', start_date: '2024-11-15', end_date: '2025-03-31', categories: ['lyže', 'snowboard', 'zimní oblečení'], priority: 'high' },
  { name: 'Běžecká sezóna', type: 'sport_season', start_date: '2025-03-01', end_date: '2025-10-31', categories: ['běžecké boty', 'běžecké oblečení'], priority: 'high' },
  { name: 'Cyklistická sezóna', type: 'sport_season', start_date: '2025-04-01', end_date: '2025-10-15', categories: ['cyklistika', 'helmy', 'brýle'], priority: 'high' },
  { name: 'Valentýn', type: 'holiday', start_date: '2025-02-01', end_date: '2025-02-14', categories: ['dárkové balení'], priority: 'medium' },
  { name: 'Black Friday', type: 'sale', start_date: '2025-11-24', end_date: '2025-12-01', categories: ['všechny'], priority: 'critical' },
  { name: 'Vánoce', type: 'holiday', start_date: '2025-12-01', end_date: '2025-12-24', categories: ['dárky', 'dárkové poukazy'], priority: 'critical' },
  { name: 'Letní výprodej', type: 'sale', start_date: '2025-07-01', end_date: '2025-08-15', categories: ['letní kolekce'], priority: 'high' },
  { name: 'Zimní výprodej', type: 'sale', start_date: '2026-01-10', end_date: '2026-02-28', categories: ['zimní kolekce'], priority: 'high' },
  { name: 'Pražský maraton', type: 'event', start_date: '2025-05-04', end_date: '2025-05-04', categories: ['běh'], priority: 'medium' },
];

export async function seedSeasonalCalendar() {
  const { turso } = await import('@/lib/turso');
  for (const event of defaultSeasonalEvents) {
    await turso.execute({
      sql: `INSERT OR IGNORE INTO seasonal_events (name, type, start_date, end_date, categories, priority, status)
            VALUES (?, ?, ?, ?, ?, ?, 'planned')`,
      args: [event.name, event.type, event.start_date, event.end_date, JSON.stringify(event.categories), event.priority],
    });
  }
}
