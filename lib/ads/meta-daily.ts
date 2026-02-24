// Helper: fetch Meta Ads daily insights with time_increment=1

const META_API_VERSION = 'v21.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

interface MetaDailyRow {
  campaignId: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
}

export async function metaDailyInsights(dateFrom?: string, dateTo?: string): Promise<MetaDailyRow[]> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN not configured');

  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!accountId) throw new Error('META_AD_ACCOUNT_ID not configured');
  const actId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

  const params = new URLSearchParams({
    access_token: token,
    level: 'campaign',
    fields: 'campaign_id,campaign_name,impressions,clicks,ctr,cpc,spend,actions',
    time_increment: '1',
    limit: '500',
  });

  if (dateFrom && dateTo) {
    params.set('time_range', JSON.stringify({ since: dateFrom, until: dateTo }));
  } else {
    params.set('date_preset', 'last_30d');
  }

  const res = await fetch(`${META_API_BASE}/${actId}/insights?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Meta daily insights error');

  return (data.data || []).map((row: any) => {
    const purchases = (row.actions || []).find((a: any) => a.action_type === 'purchase');
    return {
      campaignId: row.campaign_id,
      date: row.date_start,
      impressions: parseInt(row.impressions || '0'),
      clicks: parseInt(row.clicks || '0'),
      spend: parseFloat(row.spend || '0'),
      conversions: purchases ? parseInt(purchases.value || '0') : 0,
      ctr: parseFloat(row.ctr || '0'),
      cpc: parseFloat(row.cpc || '0'),
    };
  });
}
