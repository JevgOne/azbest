import { createClient } from '@libsql/client';

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL environment variable is not set');
}

if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_AUTH_TOKEN environment variable is not set');
}

export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL.trim(),
  authToken: process.env.TURSO_AUTH_TOKEN.trim(),
});

export async function executeQuery<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const result = await turso.execute({
    sql,
    args: params || [],
  });
  return result.rows as T[];
}

export async function executeOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const results = await executeQuery<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

export async function transaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  const tx = await turso.transaction('write');
  try {
    const result = await callback(tx);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export function dateToUnix(date: Date | null | undefined): number | null {
  if (!date) return null;
  return Math.floor(date.getTime() / 1000);
}

export function unixToDate(timestamp: number | null | undefined): Date | null {
  if (!timestamp) return null;
  return new Date(timestamp * 1000);
}

export function parseJSON<T = any>(value: string | null | undefined): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

export function stringifyJSON(value: any): string | null {
  if (!value) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}
