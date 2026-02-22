"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function SEOMetaTagsPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Meta tagy</h1>
          <p className="text-muted-foreground">Analýza meta tagů stránek</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Meta tagy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Analyzujte meta tagy stránek webu qsport.cz. Kontrola title, description, Open Graph a dalších meta tagů.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
