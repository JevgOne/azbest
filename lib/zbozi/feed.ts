export function generateZboziFeedXml(products: any[]): string {
  const items = products.map(p => `
    <SHOPITEM>
      <ITEM_ID>${p.shoptet_id}</ITEM_ID>
      <PRODUCTNAME>${escapeXml(p.name)}</PRODUCTNAME>
      <DESCRIPTION>${escapeXml(p.description || '')}</DESCRIPTION>
      <URL>https://www.qsport.cz/${p.slug || ''}</URL>
      <PRICE_VAT>${p.price}</PRICE_VAT>
      <MANUFACTURER>${escapeXml(p.brand || '')}</MANUFACTURER>
      <CATEGORYTEXT>${escapeXml(p.category || '')}</CATEGORYTEXT>
      <EAN>${p.ean || ''}</EAN>
      <DELIVERY_DATE>${p.stock > 0 ? '0' : '7'}</DELIVERY_DATE>
      <IMGURL>${p.images ? JSON.parse(p.images)[0] || '' : ''}</IMGURL>
    </SHOPITEM>
  `).join('');

  return `<?xml version="1.0" encoding="utf-8"?>\n<SHOP xmlns="http://www.zbozi.cz/ns/offer/1.0">\n${items}\n</SHOP>`;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
