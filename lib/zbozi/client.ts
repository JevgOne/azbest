const ZBOZI_API_BASE = 'https://api.zbozi.cz';

export async function zboziRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = process.env.ZBOZI_API_KEY;
  if (!apiKey) throw new Error('ZBOZI_API_KEY is not configured');

  const url = new URL(`${ZBOZI_API_BASE}${endpoint}`);
  url.searchParams.set('apiKey', apiKey);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Zboží.cz API error: ${response.status}`);
  return response.json();
}
