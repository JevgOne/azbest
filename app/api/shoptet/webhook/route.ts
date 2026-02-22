import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-shoptet-webhook-signature') || '';
    const { verifyWebhookSignature, handleWebhook } = await import('@/lib/shoptet/webhook');

    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    await handleWebhook(payload.event, payload.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Webhook error' }, { status: 500 });
  }
}
