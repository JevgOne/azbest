"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export default function InfluencersPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Influenceři</h1>
          <p className="text-muted-foreground">Správa QSPORT TEAM spolupráce</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Influenceři
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Spravujte spolupráce s influencery v rámci QSPORT TEAM. Sledujte výkon kampaní, promo kódy a dosah spolupracujících sportovců.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
