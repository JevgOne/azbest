export async function analyzeMetaTags(url: string) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const issues: any[] = [];

    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : null;
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
    const description = descMatch ? descMatch[1] : null;

    if (!title) issues.push({ type: 'error', field: 'title', message: 'Chybí title tag' });
    else if (title.length > 60) issues.push({ type: 'warning', field: 'title', message: 'Title je příliš dlouhý (>60 znaků)' });
    else if (title.length < 30) issues.push({ type: 'warning', field: 'title', message: 'Title je příliš krátký (<30 znaků)' });

    if (!description) issues.push({ type: 'error', field: 'description', message: 'Chybí meta description' });
    else if (description.length > 160) issues.push({ type: 'warning', field: 'description', message: 'Description je příliš dlouhý (>160 znaků)' });

    return {
      url, title, titleLength: title?.length || 0,
      description, descriptionLength: description?.length || 0,
      issues, score: Math.max(0, 100 - issues.length * 15),
    };
  } catch (error) {
    return { url, title: null, titleLength: 0, description: null, descriptionLength: 0, issues: [{ type: 'error', field: 'fetch', message: 'Nepodařilo se načíst stránku' }], score: 0 };
  }
}
