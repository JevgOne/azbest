"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default function SeasonalCalendarPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Sezónní kalendář</h1>
          <p className="text-muted-foreground">Plánování kampaní podle sezón a akcí</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sezónní kalendář
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Plánujte marketingové kampaně podle sportovních sezón, svátků a obchodních akcí. Black Friday, Vánoce, začátek lyžařské sezóny a další.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
