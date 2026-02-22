const META_API_VERSION = "v21.0";
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

function getAccessToken(): string {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN is not configured");
  return token;
}

function getAdAccountId(): string {
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!accountId) throw new Error("META_AD_ACCOUNT_ID is not configured");
  return accountId.startsWith("act_") ? accountId : `act_${accountId}`;
}

async function metaApiRequest<T>(endpoint: string, options: { method?: string; params?: Record<string, string>; body?: any } = {}): Promise<T> {
  const { method = "GET", params = {}, body } = options;
  const url = new URL(`${META_API_BASE}${endpoint}`);
  url.searchParams.set("access_token", getAccessToken());
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
    if (!process.env.META_ACCESS_TOKEN || !process.env.META_AD_ACCOUNT_ID) {
      const missing = [];
      if (!process.env.META_ACCESS_TOKEN) missing.push("META_ACCESS_TOKEN");
      if (!process.env.META_AD_ACCOUNT_ID) missing.push("META_AD_ACCOUNT_ID");
      return { success: false, error: `Missing: ${missing.join(", ")}` };
    }
    const info = await metaApiRequest<any>(`/${getAdAccountId()}`, { params: { fields: "id,name,account_status,currency" } });
    return { success: true, accountInfo: info };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCampaigns() {
  const response = await metaApiRequest<{ data: any[] }>(`/${getAdAccountId()}/campaigns`, {
    params: { fields: "id,name,status,objective,daily_budget,lifetime_budget", limit: "100" },
  });
  return response.data.map((c) => ({
    id: c.id, name: c.name, status: c.status, objective: c.objective,
    dailyBudget: c.daily_budget ? parseFloat(c.daily_budget) / 100 : undefined,
  }));
}

export async function getCampaignInsights(datePreset: string = "last_30d") {
  const response = await metaApiRequest<{ data: any[] }>(`/${getAdAccountId()}/insights`, {
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
  const endpoint = campaignId ? `/${campaignId}/adsets` : `/${getAdAccountId()}/adsets`;
  const response = await metaApiRequest<{ data: any[] }>(endpoint, {
    params: { fields: "id,name,status,campaign_id,daily_budget,targeting", limit: "100" },
  });
  return response.data;
}
