"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Nastavení</h1>
          <p className="text-muted-foreground">Konfigurace API klíčů a integrace</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Nastavení
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Konfigurujte API klíče pro Shoptet, Google Ads, Meta, Sklik, Ecomail, GoSMS a další služby. Spravujte integrace a nastavení aplikace.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
