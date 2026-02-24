import { NextRequest, NextResponse } from 'next/server';

// POST /api/settings/test — test connection for a specific platform
export async function POST(request: NextRequest) {
  const { getAuthUser, unauthorizedResponse } = await import('@/lib/auth/require-auth');
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { platform } = await request.json();

    let result: { success: boolean; error?: string; info?: any };

    switch (platform) {
      case 'shoptet': {
        const { testConnection } = await import('@/lib/shoptet/client');
        result = await testConnection();
        break;
      }
      case 'google_ads': {
        const { testGoogleAdsConnection } = await import('@/lib/google-ads');
        result = await testGoogleAdsConnection();
        break;
      }
      case 'meta_ads': {
        const { testMetaAdsConnection } = await import('@/lib/meta-ads');
        result = await testMetaAdsConnection();
        break;
      }
      case 'sklik': {
        try {
          const { getSklikCampaigns } = await import('@/lib/sklik/client');
          const campaigns = await getSklikCampaigns();
          result = { success: true, info: { campaigns: campaigns.length } };
        } catch (err: any) {
          result = { success: false, error: err.message };
        }
        break;
      }
      case 'heureka': {
        try {
          const { getSetting } = await import('@/lib/settings');
          const key = await getSetting('HEUREKA_API_KEY');
          result = key ? { success: true, info: { configured: true } } : { success: false, error: 'API klíč není nastaven' };
        } catch (err: any) {
          result = { success: false, error: err.message };
        }
        break;
      }
      case 'zbozi': {
        try {
          const { getSetting } = await import('@/lib/settings');
          const key = await getSetting('ZBOZI_API_KEY');
          result = key ? { success: true, info: { configured: true } } : { success: false, error: 'API klíč není nastaven' };
        } catch (err: any) {
          result = { success: false, error: err.message };
        }
        break;
      }
      case 'mergado': {
        try {
          const { getMergadoFeeds } = await import('@/lib/mergado/client');
          const feeds = await getMergadoFeeds();
          result = { success: true, info: { feeds: Array.isArray(feeds) ? feeds.length : 'ok' } };
        } catch (err: any) {
          result = { success: false, error: err.message };
        }
        break;
      }
      case 'genviral': {
        const { testGenViralConnection } = await import('@/lib/genviral/client');
        result = await testGenViralConnection();
        break;
      }
      case 'ecomail': {
        try {
          const { getSetting } = await import('@/lib/settings');
          const key = await getSetting('ECOMAIL_API_KEY');
          result = key ? { success: true, info: { configured: true } } : { success: false, error: 'API klíč není nastaven' };
        } catch (err: any) {
          result = { success: false, error: err.message };
        }
        break;
      }
      case 'gosms': {
        try {
          const { getSetting } = await import('@/lib/settings');
          const id = await getSetting('GOSMS_CLIENT_ID');
          const secret = await getSetting('GOSMS_CLIENT_SECRET');
          result = id && secret ? { success: true, info: { configured: true } } : { success: false, error: 'GoSMS credentials nejsou nastaveny' };
        } catch (err: any) {
          result = { success: false, error: err.message };
        }
        break;
      }
      case 'google_analytics': {
        try {
          const { getSetting } = await import('@/lib/settings');
          const key = await getSetting('GOOGLE_SERVICE_ACCOUNT_KEY');
          const propId = await getSetting('GA4_PROPERTY_ID');
          result = key && propId ? { success: true, info: { configured: true } } : { success: false, error: 'GA4 Property ID nebo Service Account Key chybí' };
        } catch (err: any) {
          result = { success: false, error: err.message };
        }
        break;
      }
      case 'search_console': {
        try {
          const { getSetting } = await import('@/lib/settings');
          const key = await getSetting('GOOGLE_SERVICE_ACCOUNT_KEY');
          const url = await getSetting('SEARCH_CONSOLE_SITE_URL');
          result = key && url ? { success: true, info: { configured: true } } : { success: false, error: 'Service Account Key nebo Site URL chybí' };
        } catch (err: any) {
          result = { success: false, error: err.message };
        }
        break;
      }
      default:
        return NextResponse.json({ success: false, error: `Unknown platform: ${platform}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
