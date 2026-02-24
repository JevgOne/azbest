import Anthropic from '@anthropic-ai/sdk';
import { getSetting } from '@/lib/settings';

let _client: Anthropic | null = null;

async function getClient(): Promise<Anthropic> {
  if (_client) return _client;
  const apiKey = await getSetting('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured. Set it in Settings.');
  _client = new Anthropic({ apiKey });
  return _client;
}

export interface ProductForCaption {
  name: string;
  price: number;
  priceBeforeDiscount?: number | null;
  category?: string | null;
  description?: string | null;
  url: string;
}

export async function generateProductCaption(
  product: ProductForCaption,
  customPrompt?: string | null,
): Promise<string> {
  const client = await getClient();

  const systemPrompt = customPrompt || `Jsi marketingový copywriter pro e-shop qsport.cz — autorizovaný prémiový sportovní dealer z Krkonoš.
Prodáváme vybavení, které sami používáme — na sjezdovkách, trailech, silnicích i horských stezkách v okolí Vrchlabí.
Značky: ON Running, POC, Mizuno, Maloja, Kjus, Leki, Rossignol, Volkl, Swix, Madshus a další.
Sortiment: lyžování, snowboarding, cyklistika, turistika, běh a volný čas — pro muže, ženy i děti.

Tvým úkolem je napsat krátký, poutavý caption pro Instagram/Facebook příspěvek propagující produkt.

Pravidla:
- Max 480 znaků (včetně hashtagů)
- Česky
- Zahrň cenu (pokud je sleva, výrazně ji zdůrazni)
- Přidej 3-5 relevantních hashtagů na konec (#qsport vždy)
- Buď energický, motivující, sportovní tón — autentický, ne korporátní
- Zahrň call-to-action (odkaz v biu, link v stories apod.)
- Nepoužívej emoji nadměrně, max 3-4
- Zmíň doprava zdarma nad 3 000 Kč pokud se to hodí`;

  const discount = product.priceBeforeDiscount && product.priceBeforeDiscount > product.price
    ? `Původní cena: ${product.priceBeforeDiscount} Kč, SLEVA: ${Math.round((1 - product.price / product.priceBeforeDiscount) * 100)}%`
    : null;

  const userMessage = [
    `Produkt: ${product.name}`,
    `Cena: ${product.price} Kč`,
    discount,
    product.category ? `Kategorie: ${product.category}` : null,
    product.description ? `Popis: ${product.description.substring(0, 300)}` : null,
    `URL: ${product.url}`,
  ].filter(Boolean).join('\n');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  // Trim to 500 chars (GenViral limit)
  return text.substring(0, 500).trim();
}
