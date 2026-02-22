"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export default function CompetitorsPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Konkurence</h1>
          <p className="text-muted-foreground">Monitoring konkurenčních e-shopů</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Konkurence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Monitorujte konkurenční e-shopy se sportovním zbožím. Sledujte ceny, sortiment, marketingové aktivity a pozice ve vyhledávačích.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
