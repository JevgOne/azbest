import type { Metadata } from "next";
import { AdminLayoutClient } from "./_components/AdminLayoutClient";

export const metadata: Metadata = {
  title: "QSPORT Marketing Admin",
  robots: "noindex, nofollow",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
