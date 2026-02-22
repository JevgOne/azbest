"use client";

import { usePathname } from "next/navigation";
import { AdminAuthProvider } from "./AdminAuthProvider";
import { QueryProvider } from "./QueryProvider";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <QueryProvider>
      <AdminAuthProvider>
        {children}
      </AdminAuthProvider>
    </QueryProvider>
  );
}
