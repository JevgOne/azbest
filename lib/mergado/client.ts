const MERGADO_API_BASE = 'https://app.mergado.com/api2';

export async function mergadoRequest<T>(endpoint: string, options: { method?: string; body?: any } = {}): Promise<T> {
  const token = process.env.MERGADO_API_TOKEN;
  if (!token) throw new Error('MERGADO_API_TOKEN is not configured');

  const response = await fetch(`${MERGADO_API_BASE}${endpoint}`, {
    method: options.method || 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  if (!response.ok) throw new Error(`Mergado API error: ${response.status}`);
  return response.json();
}

export async function getMergadoFeeds() {
  const shopId = process.env.MERGADO_SHOP_ID;
  return mergadoRequest<any>(`/shops/${shopId}/feeds/`);
}

export async function getMergadoRules(feedId: string) {
  return mergadoRequest<any>(`/feeds/${feedId}/rules/`);
}
