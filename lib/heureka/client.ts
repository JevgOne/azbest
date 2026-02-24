const HEUREKA_API_BASE = 'https://api.heureka.cz';

export async function heurekaRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const { getSetting } = await import('@/lib/settings');
  const apiKey = await getSetting('HEUREKA_API_KEY');
  if (!apiKey) throw new Error('HEUREKA_API_KEY is not configured');

  const url = new URL(`${HEUREKA_API_BASE}${endpoint}`);
  url.searchParams.set('apiKey', apiKey);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Heureka API error: ${response.status}`);
  return response.json();
}
