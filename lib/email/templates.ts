export function abandonedCartEmail(customerName: string, items: any[], cartUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Zapomněli jste na svůj košík?</h2>
      <p>Ahoj ${customerName},</p>
      <p>Všimli jsme si, že jste opustili svůj nákupní košík na qsport.cz.</p>
      <p><a href="${cartUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Dokončit objednávku</a></p>
      <p>S pozdravem,<br/>Tým QSPORT</p>
    </div>
  `;
}

export function welcomeEmail(customerName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Vítejte v QSPORT!</h2>
      <p>Ahoj ${customerName},</p>
      <p>Děkujeme za registraci na qsport.cz. Najdete u nás prémiové sportovní vybavení od značek jako ON Running, POC, Maloja, Kjus a další.</p>
      <p><a href="https://www.qsport.cz" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Prohlédnout nabídku</a></p>
    </div>
  `;
}
