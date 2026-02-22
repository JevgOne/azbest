"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";

export default function BrandingPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Branding</h1>
          <p className="text-muted-foreground">Vizuální identita a assets knihovna QSPORT</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Branding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Spravujte vizuální identitu QSPORT. Loga, barvy, fonty, šablony a další brandové materiály na jednom místě.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
