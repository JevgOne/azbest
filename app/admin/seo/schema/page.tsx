"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code } from "lucide-react";

export default function SEOSchemaPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Schema.org</h1>
          <p className="text-muted-foreground">Kontrola strukturovaných dat</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Schema.org
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Kontrolujte strukturovaná data (JSON-LD) na stránkách webu qsport.cz. Ověřte správnost Product, Organization, BreadcrumbList a dalších schémat.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
