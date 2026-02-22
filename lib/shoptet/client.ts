const SHOPTET_API_URL = process.env.SHOPTET_API_URL || 'https://api.myshoptet.com/api';

async function getAccessToken(): Promise<string> {
  const token = process.env.SHOPTET_ACCESS_TOKEN;
  if (!token) throw new Error('SHOPTET_ACCESS_TOKEN is not configured');
  return token;
}

export async function shoptetRequest<T>(
  endpoint: string,
  options: { method?: string; body?: any; params?: Record<string, string> } = {}
): Promise<T> {
  const { method = 'GET', body, params } = options;
  const token = await getAccessToken();

  const url = new URL(`${SHOPTET_API_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      'Shoptet-Access-Token': token,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shoptet API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.data as T;
}

export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    await shoptetRequest('/eshop');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
