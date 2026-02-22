"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";

export default function SklikPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Sklik</h1>
          <p className="text-muted-foreground">Správa Sklik kampaní (Seznam.cz)</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Sklik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Připojte Sklik účet pro správu kampaní na Seznam.cz. Nastavte API klíče v sekci Nastavení.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
