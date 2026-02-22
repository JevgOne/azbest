import { google } from "googleapis";

function getCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  throw new Error("No Google Service Account credentials found");
}

function getSearchConsoleClient() {
  const auth = new google.auth.GoogleAuth({ credentials: getCredentials(), scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  return google.searchconsole({ version: "v1", auth });
}

export async function getSearchConsoleOverview(siteUrl: string, startDate: string, endDate: string) {
  const sc = getSearchConsoleClient();
  const response = await sc.searchanalytics.query({ siteUrl, requestBody: { startDate, endDate, dimensions: ["date"], rowLimit: 1000 } });
  const rows = response.data.rows || [];
  let totalClicks = 0, totalImpressions = 0;
  const timeline = rows.map((row) => {
    totalClicks += row.clicks || 0; totalImpressions += row.impressions || 0;
    return { date: row.keys?.[0], clicks: row.clicks || 0, impressions: row.impressions || 0, ctr: (row.ctr || 0) * 100, position: row.position || 0 };
  });
  return { summary: { totalClicks, totalImpressions }, timeline };
}

export async function getTopQueries(siteUrl: string, startDate: string, endDate: string, limit = 20) {
  const sc = getSearchConsoleClient();
  const response = await sc.searchanalytics.query({ siteUrl, requestBody: { startDate, endDate, dimensions: ["query"], rowLimit: limit } });
  return (response.data.rows || []).map((row) => ({
    query: row.keys?.[0], clicks: row.clicks || 0, impressions: row.impressions || 0, ctr: (row.ctr || 0) * 100, position: row.position || 0,
  }));
}

export async function getTopPages(siteUrl: string, startDate: string, endDate: string, limit = 20) {
  const sc = getSearchConsoleClient();
  const response = await sc.searchanalytics.query({ siteUrl, requestBody: { startDate, endDate, dimensions: ["page"], rowLimit: limit } });
  return (response.data.rows || []).map((row) => ({
    page: row.keys?.[0], clicks: row.clicks || 0, impressions: row.impressions || 0, ctr: (row.ctr || 0) * 100, position: row.position || 0,
  }));
}
