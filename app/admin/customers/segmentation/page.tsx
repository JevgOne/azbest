"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck } from "lucide-react";

export default function RFMSegmentationPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">RFM Segmentace</h1>
          <p className="text-muted-foreground">Segmentace zákazníků podle RFM analýzy</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              RFM Segmentace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Segmentujte zákazníky podle Recency, Frequency a Monetary hodnot. Synchronizujte data ze Shoptet pro automatickou segmentaci.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
