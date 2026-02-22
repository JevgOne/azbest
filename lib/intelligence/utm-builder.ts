export function buildUtmUrl(baseUrl: string, params: { source: string; medium: string; campaign: string; content?: string; term?: string }): string {
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', params.source);
  url.searchParams.set('utm_medium', params.medium);
  url.searchParams.set('utm_campaign', params.campaign);
  if (params.content) url.searchParams.set('utm_content', params.content);
  if (params.term) url.searchParams.set('utm_term', params.term);
  return url.toString();
}

export async function saveUtmCampaign(data: { name: string; source: string; medium: string; campaign: string; content?: string; term?: string; url: string }) {
  const { turso } = await import('@/lib/turso');
  const generatedUrl = buildUtmUrl(data.url, data);
  await turso.execute({
    sql: `INSERT INTO utm_campaigns (name, source, medium, campaign, content, term, url, generated_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [data.name, data.source, data.medium, data.campaign, data.content || null, data.term || null, data.url, generatedUrl],
  });
  return { generatedUrl };
}
