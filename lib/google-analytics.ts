import { BetaAnalyticsDataClient } from "@google-analytics/data";

async function getPropertyId(): Promise<string> {
  const { getSetting } = await import('@/lib/settings');
  const id = await getSetting('GA4_PROPERTY_ID');
  if (!id) throw new Error('GA4_PROPERTY_ID is not configured');
  return id;
}

async function getCredentials() {
  const { getSetting } = await import('@/lib/settings');
  const key = await getSetting('GOOGLE_SERVICE_ACCOUNT_KEY');
  if (!key) throw new Error("No Google Service Account credentials found");
  return JSON.parse(key);
}

export async function getGA4Client() {
  return new BetaAnalyticsDataClient({ credentials: await getCredentials() });
}

export async function getGA4Overview(startDate = "30daysAgo", endDate = "today") {
  const client = await getGA4Client();
  const propertyId = await getPropertyId();
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "bounceRate" }, { name: "averageSessionDuration" }],
  });
  const rows = response.rows || [];
  let totalUsers = 0, totalSessions = 0, totalPageViews = 0;
  const timeline = rows.map((row) => {
    const users = parseInt(row.metricValues?.[0]?.value || "0");
    const sessions = parseInt(row.metricValues?.[1]?.value || "0");
    const pageViews = parseInt(row.metricValues?.[2]?.value || "0");
    totalUsers += users; totalSessions += sessions; totalPageViews += pageViews;
    return { date: row.dimensionValues?.[0]?.value, users, sessions, pageViews };
  });
  return { summary: { totalUsers, totalSessions, totalPageViews }, timeline };
}

export async function getGA4TopPages(startDate = "30daysAgo", endDate = "today", limit = 10) {
  const client = await getGA4Client();
  const propertyId = await getPropertyId();
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit,
  });
  return (response.rows || []).map((row) => ({
    path: row.dimensionValues?.[0]?.value, title: row.dimensionValues?.[1]?.value,
    pageViews: parseInt(row.metricValues?.[0]?.value || "0"),
  }));
}

export async function getGA4TrafficSources(startDate = "30daysAgo", endDate = "today") {
  const client = await getGA4Client();
  const propertyId = await getPropertyId();
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }, { name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
  });
  return (response.rows || []).map((row) => ({
    source: row.dimensionValues?.[0]?.value, sessions: parseInt(row.metricValues?.[0]?.value || "0"),
    users: parseInt(row.metricValues?.[1]?.value || "0"),
  }));
}
