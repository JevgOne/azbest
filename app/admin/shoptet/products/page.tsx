"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export default function ShoptetProductsPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Produkty</h1>
          <p className="text-muted-foreground">Přehled produktů synchronizovaných ze Shoptet</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produkty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Připojte Shoptet API pro zobrazení produktů. Nastavte API klíče v sekci Nastavení.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
