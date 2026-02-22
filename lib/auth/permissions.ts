export type UserRole = 'owner' | 'admin' | 'specialist';

export type Permission =
  | 'dashboard'
  | 'shoptet'
  | 'advertising'
  | 'analytics'
  | 'seo'
  | 'email'
  | 'push_notifications'
  | 'sms'
  | 'social'
  | 'nano_banana'
  | 'branding'
  | 'customers'
  | 'intelligence'
  | 'activity_logs'
  | 'settings'
  | 'users';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'dashboard', 'shoptet', 'advertising', 'analytics', 'seo',
    'email', 'push_notifications', 'sms', 'social', 'nano_banana',
    'branding', 'customers', 'intelligence', 'activity_logs', 'settings', 'users',
  ],
  admin: [
    'dashboard', 'shoptet', 'advertising', 'analytics', 'seo',
    'email', 'push_notifications', 'sms', 'social', 'nano_banana',
    'branding', 'customers', 'intelligence', 'activity_logs', 'settings',
  ],
  specialist: [
    'dashboard', 'analytics', 'seo', 'social', 'branding',
  ],
};

export const ROLE_NAMES: Record<UserRole, string> = {
  owner: 'Vlastník',
  admin: 'Administrátor',
  specialist: 'Specialista',
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.some(permission => hasPermission(role, permission));
}

export function getPermissions(role: UserRole | undefined): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] ?? [];
}

export function canManageUsers(role: UserRole | undefined): boolean {
  return hasPermission(role, 'users');
}

export function isOwner(role: UserRole | undefined): boolean {
  return role === 'owner';
}

export function isAdminOrHigher(role: UserRole | undefined): boolean {
  return role === 'owner' || role === 'admin';
}
