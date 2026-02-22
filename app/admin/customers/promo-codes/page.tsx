"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket } from "lucide-react";

export default function PromoCodesPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Promo kódy</h1>
          <p className="text-muted-foreground">Správa slevových kódů se synchronizací do Shoptet</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Promo kódy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Vytvářejte a spravujte slevové kódy s automatickou synchronizací do Shoptet. Sledujte využití kódů a jejich dopad na tržby.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
