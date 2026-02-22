"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function ReportsPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Reporty</h1>
          <p className="text-muted-foreground">Generování a správa marketingových reportů</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Reporty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Zde budete moci generovat a spravovat marketingové reporty. Připojte analytické nástroje v sekci Nastavení.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
