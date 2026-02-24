const GOSMS_API_BASE = 'https://app.gosms.cz/api/v1';

async function getGoSmsToken(): Promise<string> {
  const { getSetting } = await import('@/lib/settings');
  const clientId = await getSetting('GOSMS_CLIENT_ID');
  const clientSecret = await getSetting('GOSMS_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('GoSMS credentials not configured');

  const response = await fetch(`${GOSMS_API_BASE}/oauth/access-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' }),
  });

  const data = await response.json();
  return data.access_token;
}

export async function sendSms(recipients: string[], message: string) {
  const token = await getGoSmsToken();
  const { getSetting } = await import('@/lib/settings');
  const channelId = await getSetting('GOSMS_CHANNEL_ID');

  const response = await fetch(`${GOSMS_API_BASE}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, recipients, channel: channelId ? parseInt(channelId) : undefined }),
  });

  if (!response.ok) throw new Error(`GoSMS error: ${response.status}`);
  return response.json();
}
