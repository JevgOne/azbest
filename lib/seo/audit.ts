export async function runSeoAudit(url: string) {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&category=accessibility&category=best-practices&category=seo${apiKey ? `&key=${apiKey}` : ''}`;

  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error(`PageSpeed API error: ${response.status}`);

  const data = await response.json();
  const categories = data.lighthouseResult?.categories || {};

  return {
    url,
    performance_score: Math.round((categories.performance?.score || 0) * 100),
    accessibility_score: Math.round((categories.accessibility?.score || 0) * 100),
    best_practices_score: Math.round((categories['best-practices']?.score || 0) * 100),
    seo_score: Math.round((categories.seo?.score || 0) * 100),
    score: Math.round(((categories.performance?.score || 0) + (categories.seo?.score || 0)) / 2 * 100),
  };
}
