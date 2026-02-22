"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenTool } from "lucide-react";

export default function BlogPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-muted-foreground">Správa blogových článků</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Blog
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Vytvářejte a spravujte blogové články pro qsport.cz. Plánujte publikaci, optimalizujte SEO a sledujte čtenost článků.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
