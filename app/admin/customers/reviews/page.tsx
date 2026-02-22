"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

export default function ReviewsPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Recenze</h1>
          <p className="text-muted-foreground">Přehled recenzí z Heureka, Google a Zboží.cz</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Recenze
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Sledujte recenze zákazníků z Heureka, Google a Zboží.cz na jednom místě. Reagujte na recenze a sledujte celkové hodnocení.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
