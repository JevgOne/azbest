import { createClient, type Client } from '@libsql/client';

const DB_NOT_CONFIGURED = 'Database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.';

let _turso: Client | null = null;

if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  _turso = createClient({
    url: process.env.TURSO_DATABASE_URL.trim(),
    authToken: process.env.TURSO_AUTH_TOKEN.trim(),
  });
}

export function isDbConfigured(): boolean {
  return _turso !== null;
}

// Proxy that provides a safe execute() that throws readable errors
// This allows all existing code to import turso and call turso.execute() without null checks
const handler: ProxyHandler<Record<string, unknown>> = {
  get(_target, prop) {
    if (prop === 'execute') {
      return async (...args: unknown[]) => {
        if (!_turso) throw new Error(DB_NOT_CONFIGURED);
        return (_turso.execute as Function)(...args);
      };
    }
    if (prop === 'transaction') {
      return async (...args: unknown[]) => {
        if (!_turso) throw new Error(DB_NOT_CONFIGURED);
        return (_turso.transaction as Function)(...args);
      };
    }
    if (prop === 'batch') {
      return async (...args: unknown[]) => {
        if (!_turso) throw new Error(DB_NOT_CONFIGURED);
        return (_turso.batch as Function)(...args);
      };
    }
    if (_turso) {
      const val = (_turso as any)[prop];
      if (typeof val === 'function') return val.bind(_turso);
      return val;
    }
    return undefined;
  },
};

export const turso = new Proxy({}, handler) as unknown as Client;

export async function executeQuery<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  if (!_turso) throw new Error(DB_NOT_CONFIGURED);
  const result = await _turso.execute({
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
  if (!_turso) throw new Error(DB_NOT_CONFIGURED);
  const tx = await _turso.transaction('write');
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
