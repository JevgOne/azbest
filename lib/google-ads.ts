import { GoogleAdsApi, Customer } from "google-ads-api";

async function getConfig() {
  const { getSetting } = await import('@/lib/settings');
  return {
    client_id: (await getSetting('GOOGLE_ADS_CLIENT_ID'))!,
    client_secret: (await getSetting('GOOGLE_ADS_CLIENT_SECRET'))!,
    developer_token: (await getSetting('GOOGLE_ADS_DEVELOPER_TOKEN'))!,
  };
}

export async function getGoogleAdsCustomer(): Promise<Customer> {
  const { getSetting } = await import('@/lib/settings');
  const config = await getConfig();
  const client = new GoogleAdsApi(config);
  return client.Customer({
    customer_id: (await getSetting('GOOGLE_ADS_CUSTOMER_ID'))!,
    refresh_token: (await getSetting('GOOGLE_ADS_REFRESH_TOKEN'))!,
    ...(await getSetting('GOOGLE_ADS_LOGIN_CUSTOMER_ID') ? { login_customer_id: (await getSetting('GOOGLE_ADS_LOGIN_CUSTOMER_ID'))! } : {}),
  });
}

export async function testGoogleAdsConnection() {
  try {
    const { getSetting } = await import('@/lib/settings');
    const required = ['GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_CLIENT_SECRET', 'GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_CUSTOMER_ID', 'GOOGLE_ADS_REFRESH_TOKEN'];
    const missing: string[] = [];
    for (const v of required) {
      if (!(await getSetting(v))) missing.push(v);
    }
    if (missing.length > 0) return { success: false, error: `Missing: ${missing.join(', ')}` };

    const customer = await getGoogleAdsCustomer();
    const [response] = await customer.query(`SELECT customer.id, customer.descriptive_name, customer.currency_code FROM customer LIMIT 1`);
    return { success: true, customerInfo: response };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}

export async function getCampaignPerformance(dateRange: string = "LAST_30_DAYS") {
  const customer = await getGoogleAdsCustomer();
  const campaigns = await customer.query(`
    SELECT campaign.id, campaign.name, campaign.status, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros, metrics.conversions
    FROM campaign WHERE segments.date DURING ${dateRange} ORDER BY metrics.impressions DESC
  `);
  return campaigns.map((c: any) => ({
    id: c.campaign.id, name: c.campaign.name, status: c.campaign.status,
    impressions: c.metrics.impressions, clicks: c.metrics.clicks, ctr: c.metrics.ctr,
    avgCpc: c.metrics.average_cpc / 1000000, cost: c.metrics.cost_micros / 1000000,
    conversions: c.metrics.conversions,
  }));
}

export async function getDailyPerformance(dateRange: string = "LAST_30_DAYS") {
  const customer = await getGoogleAdsCustomer();
  const rows = await customer.query(`
    SELECT segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
    FROM campaign WHERE segments.date DURING ${dateRange} ORDER BY segments.date ASC
  `);
  const byDate: Record<string, any> = {};
  for (const row of rows as any[]) {
    const date = row.segments.date;
    if (!byDate[date]) byDate[date] = { date, impressions: 0, clicks: 0, cost: 0, conversions: 0 };
    byDate[date].impressions += row.metrics.impressions || 0;
    byDate[date].clicks += row.metrics.clicks || 0;
    byDate[date].cost += (row.metrics.cost_micros || 0) / 1000000;
    byDate[date].conversions += row.metrics.conversions || 0;
  }
  return Object.values(byDate);
}

export async function getKeywordPerformance(dateRange: string = "LAST_30_DAYS") {
  const customer = await getGoogleAdsCustomer();
  const keywords = await customer.query(`
    SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
    FROM keyword_view WHERE segments.date DURING ${dateRange} ORDER BY metrics.impressions DESC LIMIT 100
  `);
  return keywords.map((kw: any) => ({
    keyword: kw.ad_group_criterion.keyword.text, matchType: kw.ad_group_criterion.keyword.match_type,
    impressions: kw.metrics.impressions, clicks: kw.metrics.clicks,
    cost: kw.metrics.cost_micros / 1000000, conversions: kw.metrics.conversions,
  }));
}
