"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

export default function HeurekaZboziPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Heureka & Zboží.cz</h1>
          <p className="text-muted-foreground">Správa produktových feedů a bidů</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Heureka & Zboží.cz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Připojte Heureka a Zboží.cz účty pro správu produktových feedů a bidování. Nastavte API klíče v sekci Nastavení.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
