"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function ShoptetSyncPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Synchronizace</h1>
          <p className="text-muted-foreground">Správa synchronizace dat ze Shoptet</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Synchronizace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Spusťte synchronizaci dat ze Shoptet API. Ujistěte se, že máte nastavené API klíče v sekci Nastavení.</p>
            <div className="flex flex-wrap gap-3">
              <Button>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync produktů
              </Button>
              <Button>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync objednávek
              </Button>
              <Button>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync zákazníků
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
