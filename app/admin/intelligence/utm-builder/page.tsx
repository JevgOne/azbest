"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";

export default function UTMBuilderPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">UTM Builder</h1>
          <p className="text-muted-foreground">Generování UTM parametrů pro kampaně</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              UTM Builder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Generujte UTM parametry pro marketingové kampaně. Vytvářejte sledovací URL, spravujte konvence pojmenování a exportujte pro použití v kampaních.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
