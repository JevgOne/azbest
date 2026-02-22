"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export default function PushNotificationsPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Push Notifikace</h1>
          <p className="text-muted-foreground">Správa web push notifikací</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifikace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Spravujte web push notifikace pro zákazníky qsport.cz. Vytvářejte kampaně, segmentujte odběratele a sledujte výkon.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
