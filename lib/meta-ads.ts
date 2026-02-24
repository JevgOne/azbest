const META_API_VERSION = "v21.0";
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

async function getAccessToken(): Promise<string> {
  const { getSetting } = await import('@/lib/settings');
  const token = await getSetting('META_ACCESS_TOKEN');
  if (!token) throw new Error("META_ACCESS_TOKEN is not configured");
  return token;
}

async function getAdAccountId(): Promise<string> {
  const { getSetting } = await import('@/lib/settings');
  const accountId = await getSetting('META_AD_ACCOUNT_ID');
  if (!accountId) throw new Error("META_AD_ACCOUNT_ID is not configured");
  return accountId.startsWith("act_") ? accountId : `act_${accountId}`;
}

async function metaApiRequest<T>(endpoint: string, options: { method?: string; params?: Record<string, string>; body?: any } = {}): Promise<T> {
  const { method = "GET", params = {}, body } = options;
  const url = new URL(`${META_API_BASE}${endpoint}`);
  url.searchParams.set("access_token", await getAccessToken());
  if (method === "GET") Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const response = await fetch(url.toString(), {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body && method !== "GET" ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `Meta API error: ${response.status}`);
  return data;
}

export async function testMetaAdsConnection() {
  try {
    const { getSetting } = await import('@/lib/settings');
    const token = await getSetting('META_ACCESS_TOKEN');
    const accountId = await getSetting('META_AD_ACCOUNT_ID');
    if (!token || !accountId) {
      const missing = [];
      if (!token) missing.push("META_ACCESS_TOKEN");
      if (!accountId) missing.push("META_AD_ACCOUNT_ID");
      return { success: false, error: `Missing: ${missing.join(", ")}` };
    }
    const actId = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
    const info = await metaApiRequest<any>(`/${actId}`, { params: { fields: "id,name,account_status,currency" } });
    return { success: true, accountInfo: info };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCampaigns() {
  const actId = await getAdAccountId();
  const response = await metaApiRequest<{ data: any[] }>(`/${actId}/campaigns`, {
    params: { fields: "id,name,status,objective,daily_budget,lifetime_budget", limit: "100" },
  });
  return response.data.map((c) => ({
    id: c.id, name: c.name, status: c.status, objective: c.objective,
    dailyBudget: c.daily_budget ? parseFloat(c.daily_budget) / 100 : undefined,
  }));
}

export async function getCampaignInsights(datePreset: string = "last_30d") {
  const actId = await getAdAccountId();
  const response = await metaApiRequest<{ data: any[] }>(`/${actId}/insights`, {
    params: { level: "campaign", fields: "campaign_id,campaign_name,impressions,clicks,ctr,cpc,spend,reach", date_preset: datePreset, limit: "100" },
  });
  return response.data.map((i) => ({
    campaignId: i.campaign_id, campaignName: i.campaign_name,
    impressions: parseInt(i.impressions || "0"), clicks: parseInt(i.clicks || "0"),
    ctr: parseFloat(i.ctr || "0"), cpc: parseFloat(i.cpc || "0"),
    spend: parseFloat(i.spend || "0"), reach: parseInt(i.reach || "0"),
  }));
}

export async function getAdSets(campaignId?: string) {
  const actId = await getAdAccountId();
  const endpoint = campaignId ? `/${campaignId}/adsets` : `/${actId}/adsets`;
  const response = await metaApiRequest<{ data: any[] }>(endpoint, {
    params: { fields: "id,name,status,campaign_id,daily_budget,targeting", limit: "100" },
  });
  return response.data;
}
