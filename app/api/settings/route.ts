import { NextRequest, NextResponse } from 'next/server';

// All platform keys grouped for the UI
const PLATFORM_KEYS: Record<string, { label: string; keys: { key: string; label: string; secret?: boolean }[] }> = {
  shoptet: {
    label: 'Shoptet',
    keys: [
      { key: 'SHOPTET_API_URL', label: 'API URL' },
      { key: 'SHOPTET_ACCESS_TOKEN', label: 'Access Token', secret: true },
    ],
  },
  google_ads: {
    label: 'Google Ads',
    keys: [
      { key: 'GOOGLE_ADS_CLIENT_ID', label: 'Client ID' },
      { key: 'GOOGLE_ADS_CLIENT_SECRET', label: 'Client Secret', secret: true },
      { key: 'GOOGLE_ADS_DEVELOPER_TOKEN', label: 'Developer Token', secret: true },
      { key: 'GOOGLE_ADS_CUSTOMER_ID', label: 'Customer ID' },
      { key: 'GOOGLE_ADS_REFRESH_TOKEN', label: 'Refresh Token', secret: true },
      { key: 'GOOGLE_ADS_LOGIN_CUSTOMER_ID', label: 'Login Customer ID (volitelné)' },
    ],
  },
  meta_ads: {
    label: 'Meta Ads',
    keys: [
      { key: 'META_ACCESS_TOKEN', label: 'Access Token', secret: true },
      { key: 'META_AD_ACCOUNT_ID', label: 'Ad Account ID' },
    ],
  },
  sklik: {
    label: 'Sklik',
    keys: [
      { key: 'SKLIK_API_TOKEN', label: 'API Token', secret: true },
      { key: 'SKLIK_USER_ID', label: 'User ID' },
    ],
  },
  heureka: {
    label: 'Heureka',
    keys: [
      { key: 'HEUREKA_API_KEY', label: 'API Key', secret: true },
      { key: 'HEUREKA_SHOP_ID', label: 'Shop ID' },
    ],
  },
  zbozi: {
    label: 'Zboží.cz',
    keys: [
      { key: 'ZBOZI_API_KEY', label: 'API Key', secret: true },
      { key: 'ZBOZI_SHOP_ID', label: 'Shop ID' },
    ],
  },
  mergado: {
    label: 'Mergado',
    keys: [
      { key: 'MERGADO_API_TOKEN', label: 'API Token', secret: true },
      { key: 'MERGADO_SHOP_ID', label: 'Shop ID' },
    ],
  },
  genviral: {
    label: 'GenViral',
    keys: [
      { key: 'GENVIRAL_API_KEY', label: 'API Key', secret: true },
    ],
  },
  ecomail: {
    label: 'Ecomail',
    keys: [
      { key: 'ECOMAIL_API_KEY', label: 'API Key', secret: true },
      { key: 'ECOMAIL_LIST_ID', label: 'List ID' },
    ],
  },
  gosms: {
    label: 'GoSMS',
    keys: [
      { key: 'GOSMS_CLIENT_ID', label: 'Client ID' },
      { key: 'GOSMS_CLIENT_SECRET', label: 'Client Secret', secret: true },
      { key: 'GOSMS_CHANNEL_ID', label: 'Channel ID' },
    ],
  },
  google_analytics: {
    label: 'Google Analytics',
    keys: [
      { key: 'GA4_PROPERTY_ID', label: 'GA4 Property ID' },
      { key: 'GOOGLE_SERVICE_ACCOUNT_KEY', label: 'Service Account Key (JSON)', secret: true },
    ],
  },
  search_console: {
    label: 'Search Console',
    keys: [
      { key: 'SEARCH_CONSOLE_SITE_URL', label: 'Site URL' },
    ],
  },
};

// GET /api/settings — get all settings with masked values
export async function GET() {
  const { getAuthUser, unauthorizedResponse } = await import('@/lib/auth/require-auth');
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { getSettingsStatus } = await import('@/lib/settings');

    // Collect all keys
    const allKeys = Object.values(PLATFORM_KEYS).flatMap(p => p.keys.map(k => k.key));
    const status = await getSettingsStatus(allKeys);

    // Build response grouped by platform
    const platforms = Object.entries(PLATFORM_KEYS).map(([id, platform]) => ({
      id,
      label: platform.label,
      keys: platform.keys.map(k => ({
        key: k.key,
        label: k.label,
        secret: k.secret || false,
        configured: status[k.key]?.masked !== null,
        inDb: status[k.key]?.inDb || false,
        masked: status[k.key]?.masked || null,
      })),
    }));

    return NextResponse.json({ success: true, data: platforms });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/settings — save settings
export async function POST(request: NextRequest) {
  const { getAuthUser, unauthorizedResponse } = await import('@/lib/auth/require-auth');
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { keys } = body as { keys: Record<string, string> };

    if (!keys || typeof keys !== 'object') {
      return NextResponse.json({ success: false, error: 'Missing keys object' }, { status: 400 });
    }

    // Validate that all keys are in our known list
    const allValidKeys = new Set(Object.values(PLATFORM_KEYS).flatMap(p => p.keys.map(k => k.key)));
    for (const key of Object.keys(keys)) {
      if (!allValidKeys.has(key)) {
        return NextResponse.json({ success: false, error: `Unknown key: ${key}` }, { status: 400 });
      }
    }

    const { setSettings } = await import('@/lib/settings');
    await setSettings(keys);

    const { logActivity } = await import('@/lib/activity-log');
    logActivity({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'settings_updated',
      entityType: 'settings',
      details: `Updated keys: ${Object.keys(keys).join(', ')}`,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
