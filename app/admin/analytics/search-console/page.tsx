"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function SearchConsolePage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Search Console</h1>
          <p className="text-muted-foreground">Výkon ve vyhledávání Google</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Console
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Připojte Google Search Console pro zobrazení výkonu ve vyhledávání. Nastavte API klíče v sekci Nastavení.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
