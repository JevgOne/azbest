import { NextResponse } from 'next/server';

export interface ShoptetWebhookPayload {
  event: string;
  eventInstance: string;
  shopId: number;
  eshopId: number;
  data?: any;
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const crypto = require('crypto');
  const secret = process.env.SHOPTET_CLIENT_SECRET || '';
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return signature === expectedSignature;
}

export async function handleWebhook(event: string, data: any) {
  switch (event) {
    case 'order:create':
    case 'order:update':
      // Trigger order sync
      break;
    case 'product:create':
    case 'product:update':
      // Trigger product sync
      break;
    default:
      console.log(`Unhandled webhook event: ${event}`);
  }
}
