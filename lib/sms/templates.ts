export const smsTemplates = {
  abandoned_cart: {
    name: 'Opuštěný košík',
    template: 'Ahoj {name}! V košíku na qsport.cz máte nezaplacené zboží. Dokončete objednávku: {url}',
  },
  order_shipped: {
    name: 'Zásilka odeslána',
    template: 'Vaše objednávka {orderNumber} z qsport.cz byla odeslána. Sledování: {trackingUrl}',
  },
  promo: {
    name: 'Akce',
    template: 'QSPORT: {message} Sleva {discount}% s kódem {code}. Platí do {validTo}. www.qsport.cz',
  },
};
