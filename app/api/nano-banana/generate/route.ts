import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';
import { logActivity } from '@/lib/activity-log';

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { prompt, style, width, height, templateId } = await request.json();
    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    // Generate image via Nano Banana (Replicate/Stable Diffusion)
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json({ success: false, error: 'Image generation not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: process.env.REPLICATE_MODEL_VERSION || 'stability-ai/sdxl:latest',
        input: {
          prompt: style ? `${prompt}, ${style}` : prompt,
          width: width || 1024,
          height: height || 1024,
        },
      }),
    });

    const prediction = await response.json();

    // Store generation record
    const { turso } = await import('@/lib/turso');
    await turso.execute({
      sql: `INSERT INTO generated_images (prediction_id, prompt, style, width, height, status, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())`,
      args: [prediction.id, prompt, style || null, width || 1024, height || 1024, prediction.status, user.email],
    });

    await logActivity({
      userId: user.id, userEmail: user.email, userName: user.name,
      action: 'image_generated', entityType: 'image', entityId: prediction.id,
      details: `Generated image: ${prompt.substring(0, 100)}`,
    }).catch(() => {});

    return NextResponse.json({ success: true, data: prediction });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
