import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'File type not allowed' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    // Store locally or upload to cloud storage
    const uploadDir = process.env.UPLOAD_DIR || '/tmp/uploads';
    const fs = await import('fs/promises');
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(`${uploadDir}/${filename}`, buffer);

    const fileUrl = `/uploads/${filename}`;

    // Log upload in DB
    const { turso } = await import('@/lib/turso');
    await turso.execute({
      sql: `INSERT INTO uploads (filename, original_name, mime_type, size, url, uploaded_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, unixepoch())`,
      args: [filename, file.name, file.type, file.size, fileUrl, user.email],
    });

    return NextResponse.json({ success: true, data: { url: fileUrl, filename, size: file.size } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
