export async function checkSchemaOrg(url: string) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const schemas: any[] = [];
    const errors: string[] = [];

    const jsonLdMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        schemas.push({ type: parsed['@type'] || 'Unknown', properties: parsed, valid: true, errors: [] });
      } catch {
        errors.push('Invalid JSON-LD found');
      }
    }

    if (schemas.length === 0) errors.push('No Schema.org markup found');

    return { url, schemas, valid: errors.length === 0, errors, warnings: [] };
  } catch (error) {
    return { url, schemas: [], valid: false, errors: ['Failed to fetch page'], warnings: [] };
  }
}
