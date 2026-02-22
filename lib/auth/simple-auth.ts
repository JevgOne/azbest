import bcrypt from 'bcryptjs';
import type { UserRole } from './permissions';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
}

export interface DbAdminUser {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: UserRole;
  active: number;
  created_at: number;
}

const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET;
if (!TOKEN_SECRET) {
  console.error('CRITICAL: ADMIN_TOKEN_SECRET is not set!');
}

const LEGACY_ADMIN_USERS = [
  {
    id: 'admin-1',
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
    name: 'Owner',
    role: 'owner' as const,
  },
];

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function getDbAdminByEmail(email: string): Promise<DbAdminUser | null> {
  try {
    const { isDbConfigured, turso } = await import('@/lib/turso');
    if (!isDbConfigured()) return null;
    const result = await turso.execute({
      sql: 'SELECT * FROM admins WHERE email = ? AND active = 1',
      args: [email],
    });
    if (result.rows.length > 0) {
      return result.rows[0] as unknown as DbAdminUser;
    }
    return null;
  } catch (error) {
    console.error('Error fetching DB admin:', error);
    return null;
  }
}

export async function getDbAdminById(id: string): Promise<DbAdminUser | null> {
  try {
    const { isDbConfigured, turso } = await import('@/lib/turso');
    if (!isDbConfigured()) return null;
    const result = await turso.execute({
      sql: 'SELECT * FROM admins WHERE id = ? AND active = 1',
      args: [id],
    });
    if (result.rows.length > 0) {
      return result.rows[0] as unknown as DbAdminUser;
    }
    return null;
  } catch (error) {
    console.error('Error fetching DB admin by ID:', error);
    return null;
  }
}

export async function getAllDbAdmins(): Promise<DbAdminUser[]> {
  try {
    const { isDbConfigured, turso } = await import('@/lib/turso');
    if (!isDbConfigured()) return [];
    const result = await turso.execute({
      sql: 'SELECT id, email, name, role, active, created_at FROM admins ORDER BY created_at DESC',
      args: [],
    });
    return result.rows as unknown as DbAdminUser[];
  } catch (error) {
    console.error('Error fetching all DB admins:', error);
    return [];
  }
}

export async function createDbAdmin(
  email: string,
  password: string,
  name: string,
  role: UserRole = 'admin'
): Promise<DbAdminUser | null> {
  try {
    const { isDbConfigured, turso } = await import('@/lib/turso');
    if (!isDbConfigured()) throw new Error('Database not configured');
    const id = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const passwordHash = await hashPassword(password);
    await turso.execute({
      sql: `INSERT INTO admins (id, email, name, password_hash, role, active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, unixepoch(), unixepoch())`,
      args: [id, email, name, passwordHash, role],
    });
    return { id, email, name, password_hash: passwordHash, role, active: 1, created_at: Math.floor(Date.now() / 1000) };
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      throw new Error('Email already exists');
    }
    throw error;
  }
}

export async function updateDbAdmin(
  id: string,
  data: { name?: string; email?: string; password?: string; role?: UserRole; active?: boolean }
): Promise<boolean> {
  try {
    const { isDbConfigured, turso } = await import('@/lib/turso');
    if (!isDbConfigured()) return false;
    const updates: string[] = [];
    const args: any[] = [];
    if (data.name !== undefined) { updates.push('name = ?'); args.push(data.name); }
    if (data.email !== undefined) { updates.push('email = ?'); args.push(data.email); }
    if (data.password !== undefined) { updates.push('password_hash = ?'); args.push(await hashPassword(data.password)); }
    if (data.role !== undefined) { updates.push('role = ?'); args.push(data.role); }
    if (data.active !== undefined) { updates.push('active = ?'); args.push(data.active ? 1 : 0); }
    if (updates.length === 0) return false;
    updates.push('updated_at = unixepoch()');
    args.push(id);
    await turso.execute({
      sql: `UPDATE admins SET ${updates.join(', ')} WHERE id = ?`,
      args,
    });
    return true;
  } catch (error) {
    console.error('Error updating DB admin:', error);
    return false;
  }
}

export async function deleteDbAdmin(id: string): Promise<boolean> {
  try {
    const { isDbConfigured, turso } = await import('@/lib/turso');
    if (!isDbConfigured()) return false;
    await turso.execute({
      sql: 'UPDATE admins SET active = 0, updated_at = unixepoch() WHERE id = ?',
      args: [id],
    });
    return true;
  } catch (error) {
    console.error('Error deleting DB admin:', error);
    return false;
  }
}

export async function verifyAdminCredentials(email: string, password: string): Promise<AdminUser | null> {
  const dbAdmin = await getDbAdminByEmail(email);
  if (dbAdmin && dbAdmin.password_hash) {
    const isValid = await comparePassword(password, dbAdmin.password_hash);
    if (isValid) {
      return { id: dbAdmin.id, email: dbAdmin.email, name: dbAdmin.name, role: dbAdmin.role };
    }
  }
  const legacyAdmin = LEGACY_ADMIN_USERS.find((user) => user.email === email);
  if (!legacyAdmin || !legacyAdmin.password) return null;
  if (password === legacyAdmin.password) {
    return { id: legacyAdmin.id, email: legacyAdmin.email, name: legacyAdmin.name, role: legacyAdmin.role };
  }
  return null;
}

export function generateSessionToken(user: AdminUser): string {
  const payload = {
    id: user.id, email: user.email, name: user.name,
    role: user.role || 'admin',
    exp: Date.now() + (24 * 60 * 60 * 1000),
  };
  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString('base64url');
  const signature = createSignature(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): AdminUser | null {
  try {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return null;
    const expectedSignature = createSignature(encoded);
    if (signature !== expectedSignature) return null;
    const data = Buffer.from(encoded, 'base64url').toString('utf-8');
    const payload = JSON.parse(data);
    if (payload.exp && payload.exp < Date.now()) return null;
    const legacyAdmin = LEGACY_ADMIN_USERS.find(u => u.id === payload.id && u.email === payload.email);
    if (legacyAdmin) {
      return { id: payload.id, email: payload.email, name: payload.name, role: legacyAdmin.role };
    }
    if (payload.id?.startsWith('admin-')) {
      return { id: payload.id, email: payload.email, name: payload.name, role: payload.role || 'admin' };
    }
    return null;
  } catch {
    return null;
  }
}

function createSignature(data: string): string {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
}
