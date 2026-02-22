const SKLIK_API_URL = 'https://api.sklik.cz/drak/json/';

export async function sklikRequest(method: string, params: any = {}) {
  const token = process.env.SKLIK_API_TOKEN;
  if (!token) throw new Error('SKLIK_API_TOKEN is not configured');

  const response = await fetch(`${SKLIK_API_URL}${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session: token, ...params }),
  });

  const data = await response.json();
  if (data.status !== 200) throw new Error(data.statusMessage || 'Sklik API error');
  return data;
}

export async function getSklikCampaigns() {
  const data = await sklikRequest('campaigns.list', {
    userId: parseInt(process.env.SKLIK_USER_ID || '0'),
  });
  return data.campaigns || [];
}

export async function getSklikKeywords(campaignId: number) {
  const data = await sklikRequest('keywords.list', { campaignId });
  return data.keywords || [];
}

export async function getSklikStats(campaignIds: number[], dateFrom: string, dateTo: string) {
  const data = await sklikRequest('campaigns.stats', {
    campaignIds,
    dateFrom,
    dateTo,
    granularity: 'daily',
  });
  return data.report || [];
}
