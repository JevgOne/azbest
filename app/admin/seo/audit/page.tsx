"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function SEOAuditPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">SEO Audit</h1>
          <p className="text-muted-foreground">Analýza technického SEO webu qsport.cz</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              SEO Audit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Spusťte SEO audit pro analýzu technického stavu webu qsport.cz. Výsledky budou zahrnovat kontrolu meta tagů, rychlosti načítání, mobilní optimalizace a dalších faktorů.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
