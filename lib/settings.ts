import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive a 32-byte encryption key from ADMIN_TOKEN_SECRET.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ADMIN_TOKEN_SECRET;
  if (!secret) throw new Error('ADMIN_TOKEN_SECRET is not configured');
  return createHash('sha256').update(secret).digest();
}

function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decrypt(encoded: string): string {
  const key = getEncryptionKey();
  const parts = encoded.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted format');
  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const ciphertext = Buffer.from(parts[2], 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}

/**
 * Mask a value for display — show first 4 chars + ****
 */
export function maskValue(value: string): string {
  if (value.length <= 8) return '****';
  return value.substring(0, 4) + '****';
}

/**
 * Get a setting value. Reads from DB first (decrypts), falls back to process.env.
 */
export async function getSetting(key: string): Promise<string | null> {
  try {
    const { turso } = await import('@/lib/turso');
    const result = await turso.execute({
      sql: `SELECT value FROM settings WHERE key = ?`,
      args: [key],
    });
    if (result.rows.length > 0) {
      const encrypted = (result.rows[0] as any).value as string;
      try {
        return decrypt(encrypted);
      } catch {
        // If decryption fails, return raw value (might be unencrypted legacy)
        return encrypted;
      }
    }
  } catch {
    // DB not available — fall through to env
  }
  return process.env[key] || null;
}

/**
 * Get multiple settings at once.
 */
export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  for (const key of keys) {
    result[key] = await getSetting(key);
  }
  return result;
}

/**
 * Check which keys exist in the DB (for UI badges).
 */
export async function getSettingsStatus(keys: string[]): Promise<Record<string, { inDb: boolean; masked: string | null }>> {
  const result: Record<string, { inDb: boolean; masked: string | null }> = {};

  try {
    const { turso } = await import('@/lib/turso');

    for (const key of keys) {
      const dbResult = await turso.execute({
        sql: `SELECT value FROM settings WHERE key = ?`,
        args: [key],
      });

      if (dbResult.rows.length > 0) {
        const encrypted = (dbResult.rows[0] as any).value as string;
        try {
          const decrypted = decrypt(encrypted);
          result[key] = { inDb: true, masked: maskValue(decrypted) };
        } catch {
          result[key] = { inDb: true, masked: '****' };
        }
      } else if (process.env[key]) {
        result[key] = { inDb: false, masked: maskValue(process.env[key]!) };
      } else {
        result[key] = { inDb: false, masked: null };
      }
    }
  } catch {
    // DB not available — check env only
    for (const key of keys) {
      if (process.env[key]) {
        result[key] = { inDb: false, masked: maskValue(process.env[key]!) };
      } else {
        result[key] = { inDb: false, masked: null };
      }
    }
  }

  return result;
}

/**
 * Save a setting (encrypted) to DB.
 */
export async function setSetting(key: string, value: string): Promise<void> {
  const { turso } = await import('@/lib/turso');
  const encrypted = encrypt(value);
  await turso.execute({
    sql: `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, unixepoch())
          ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=unixepoch()`,
    args: [key, encrypted],
  });
}

/**
 * Save multiple settings at once.
 */
export async function setSettings(entries: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(entries)) {
    if (value && value.trim()) {
      await setSetting(key, value.trim());
    }
  }
}

/**
 * Delete a setting from DB.
 */
export async function deleteSetting(key: string): Promise<void> {
  const { turso } = await import('@/lib/turso');
  await turso.execute({
    sql: `DELETE FROM settings WHERE key = ?`,
    args: [key],
  });
}
