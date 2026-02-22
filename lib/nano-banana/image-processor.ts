export async function processAndStoreImage(imageData: { url: string; prompt: string; style?: string; category?: string }, userId?: string) {
  const { turso } = await import('@/lib/turso');
  await turso.execute({
    sql: `INSERT INTO generated_images (prompt, style, image_url, model, category, created_by) VALUES (?, ?, ?, 'gemini-3-pro-image', ?, ?)`,
    args: [imageData.prompt, imageData.style || null, imageData.url, imageData.category || null, userId || null],
  });
}

export async function getGallery(limit = 50, category?: string) {
  const { turso } = await import('@/lib/turso');
  const sql = category
    ? 'SELECT * FROM generated_images WHERE category = ? ORDER BY created_at DESC LIMIT ?'
    : 'SELECT * FROM generated_images ORDER BY created_at DESC LIMIT ?';
  const args = category ? [category, limit] : [limit];
  const result = await turso.execute({ sql, args });
  return result.rows;
}
