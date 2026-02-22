"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { UserRole, Permission } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/permissions";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  can: (permission: Permission) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  user: null,
  loading: true,
  can: () => false,
});

export const useAdminAuth = () => useContext(AdminAuthContext);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          router.push("/admin/login");
        }
      } catch {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Na\u010D\u00EDt\u00E1n\u00ED...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const can = (permission: Permission): boolean => {
    return hasPermission(user?.role, permission);
  };

  return (
    <AdminAuthContext.Provider value={{ user, loading, can }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
