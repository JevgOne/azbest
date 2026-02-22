export async function generateReportPdf(reportData: { title: string; dateFrom: string; dateTo: string; sections: any[] }) {
  // In production, use @react-pdf/renderer
  // For now, store report data as JSON
  const { turso } = await import('@/lib/turso');
  const result = await turso.execute({
    sql: `INSERT INTO reports (type, title, date_from, date_to, data, status) VALUES ('custom', ?, ?, ?, ?, 'generated') RETURNING id`,
    args: [reportData.title, reportData.dateFrom, reportData.dateTo, JSON.stringify(reportData.sections)],
  });
  return { id: (result.rows[0] as any)?.id, title: reportData.title };
}
