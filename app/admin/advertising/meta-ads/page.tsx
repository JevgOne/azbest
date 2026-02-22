"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

export default function MetaAdsPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Meta Ads</h1>
          <p className="text-muted-foreground">Správa Facebook & Instagram kampaní</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Meta Ads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Připojte Meta Business účet pro správu Facebook a Instagram kampaní. Nastavte API klíče v sekci Nastavení.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
