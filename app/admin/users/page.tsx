"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export default function UsersPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Uživatelé</h1>
          <p className="text-muted-foreground">Správa administrátorských účtů</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Uživatelé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Spravujte administrátorské účty, role a oprávnění. Přidávejte nové uživatele a nastavujte přístupová práva.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
