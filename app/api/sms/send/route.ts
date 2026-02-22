import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';
import { logActivity } from '@/lib/activity-log';

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { to, message, campaignId } = await request.json();
    if (!to || !message) {
      return NextResponse.json({ success: false, error: 'Phone number and message are required' }, { status: 400 });
    }

    // Send SMS via configured provider
    const smsApiKey = process.env.SMS_API_KEY;
    const smsApiUrl = process.env.SMS_API_URL || 'https://api.smsbrana.cz/smsconnect/http.php';

    if (!smsApiKey) {
      return NextResponse.json({ success: false, error: 'SMS provider not configured' }, { status: 500 });
    }

    const params = new URLSearchParams({
      login: process.env.SMS_LOGIN || '',
      password: smsApiKey,
      number: to,
      message,
      action: 'send_sms',
    });

    const response = await fetch(`${smsApiUrl}?${params.toString()}`);
    const responseText = await response.text();

    // Log the SMS
    const { turso } = await import('@/lib/turso');
    await turso.execute({
      sql: `INSERT INTO sms_logs (phone, message, campaign_id, status, response, sent_at)
            VALUES (?, ?, ?, ?, ?, unixepoch())`,
      args: [to, message, campaignId || null, response.ok ? 'sent' : 'failed', responseText],
    });

    await logActivity({
      userId: user.id, userEmail: user.email, userName: user.name,
      action: 'sms_sent', entityType: 'sms',
      details: `SMS sent to ${to}`,
    }).catch(() => {});

    return NextResponse.json({ success: true, data: { status: response.ok ? 'sent' : 'failed' } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
