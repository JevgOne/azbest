const GENVIRAL_API_BASE = 'https://www.genviral.io/api/partner/v1';

async function getApiKey(): Promise<string> {
  const { getSetting } = await import('@/lib/settings');
  const key = await getSetting('GENVIRAL_API_KEY');
  if (!key) throw new Error('GENVIRAL_API_KEY is not configured');
  return key;
}

export async function genviralRequest<T>(
  endpoint: string,
  options: { method?: string; body?: any; params?: Record<string, string> } = {}
): Promise<T> {
  const { method = 'GET', body, params = {} } = options;
  const url = new URL(`${GENVIRAL_API_BASE}${endpoint}`);

  if (method === 'GET') {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const apiKey = await getApiKey();
  const response = await fetch(url.toString(), {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    ...(body && method !== 'GET' ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error((errorData as any).message || `GenViral API error: ${response.status}`);
  }

  return response.json();
}

export async function testGenViralConnection() {
  try {
    const key = await getApiKey().catch(() => null);
    if (!key) {
      return { success: false, error: 'Missing: GENVIRAL_API_KEY' };
    }
    const accounts = await genviralRequest<{ data: any[] }>('/accounts');
    return { success: true, accountCount: accounts.data?.length || 0 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
