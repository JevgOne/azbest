const ECOMAIL_API_BASE = 'https://api2.ecomail.app';

export async function ecomailRequest<T>(endpoint: string, options: { method?: string; body?: any } = {}): Promise<T> {
  const apiKey = process.env.ECOMAIL_API_KEY;
  if (!apiKey) throw new Error('ECOMAIL_API_KEY is not configured');

  const response = await fetch(`${ECOMAIL_API_BASE}${endpoint}`, {
    method: options.method || 'GET',
    headers: { 'key': apiKey, 'Content-Type': 'application/json' },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  if (!response.ok) throw new Error(`Ecomail API error: ${response.status}`);
  return response.json();
}

export async function getSubscribers(listId?: string) {
  const id = listId || process.env.ECOMAIL_LIST_ID;
  return ecomailRequest<any>(`/lists/${id}/subscribers`);
}

export async function addSubscriber(email: string, data: any = {}, listId?: string) {
  const id = listId || process.env.ECOMAIL_LIST_ID;
  return ecomailRequest<any>(`/lists/${id}/subscribe`, {
    method: 'POST',
    body: { subscriber_data: { email, ...data } },
  });
}
