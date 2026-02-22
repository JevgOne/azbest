export const vapidConfig = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  subject: process.env.NEXT_PUBLIC_SITE_URL || 'https://qsport.cz',
};
