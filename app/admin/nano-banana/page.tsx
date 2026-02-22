"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function NanoBananaPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Nano Banana Pro</h1>
          <p className="text-muted-foreground">AI generování grafiky pro marketing</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Nano Banana Pro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Generujte marketingovou grafiku pomocí AI. Integrace s Gemini 3 Pro Image pro tvorbu bannerů, produktových obrázků a sociálních příspěvků.</p>
            <p className="text-muted-foreground">Nastavte Gemini API klíč v sekci Nastavení pro aktivaci AI generování grafiky.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
