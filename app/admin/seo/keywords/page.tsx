"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

export default function SEOKeywordsPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Keywords</h1>
          <p className="text-muted-foreground">Sledování pozic klíčových slov</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Keywords
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Sledujte pozice klíčových slov ve vyhledávačích. Přidejte klíčová slova pro monitoring a sledujte jejich vývoj v čase.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
