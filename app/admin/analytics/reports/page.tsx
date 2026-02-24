"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/admin/EmptyState";
import { FileText, Plus, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";

interface ReportRow {
  report_id: string;
  type: string;
  date_range: string;
  format: string;
  generated_by: string;
  created_at: number;
}

const TYPE_LABELS: Record<string, string> = {
  traffic: "Traffic",
  ads: "Reklama",
  weekly: "Týdenní",
  monthly: "Měsíční",
  seo: "SEO",
  custom: "Vlastní",
};

const RANGE_LABELS: Record<string, string> = {
  last_7_days: "Posledních 7 dní",
  last_30_days: "Posledních 30 dní",
  last_90_days: "Posledních 90 dní",
};

function formatTimestamp(ts: number): string {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ReportsPage() {
  const { user } = useAdminAuth();
  const [generating, setGenerating] = useState(false);

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ["reports-list"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/reports");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as ReportRow[];
    },
  });

  const handleGenerate = async (type: string, dateRange: string) => {
    setGenerating(true);
    try {
      const res = await fetch("/api/analytics/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, dateRange }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      await refetch();
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-[400px]" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Reporty</h1>
            <p className="text-muted-foreground">Generování a správa marketingových reportů</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleGenerate("weekly", "last_7_days")}
              disabled={generating}
            >
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Týdenní report
            </Button>
            <Button
              onClick={() => handleGenerate("monthly", "last_30_days")}
              disabled={generating}
            >
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Měsíční report
            </Button>
          </div>
        </div>

        {/* Reports Table */}
        {!reports?.length ? (
          <EmptyState
            icon={FileText}
            title="Žádné reporty"
            description="Vygenerujte první report kliknutím na tlačítko výše. Report kombinuje data z Google Analytics a Search Console."
            action={
              <Button onClick={() => handleGenerate("weekly", "last_7_days")} disabled={generating}>
                <Plus className="h-4 w-4 mr-2" />
                Generovat týdenní report
              </Button>
            }
          />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Historie reportů</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Období</TableHead>
                    <TableHead>Formát</TableHead>
                    <TableHead>Vytvořil</TableHead>
                    <TableHead>Datum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.report_id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {report.report_id?.slice(0, 20)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {TYPE_LABELS[report.type] || report.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {RANGE_LABELS[report.date_range] || report.date_range}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="uppercase text-xs">
                          {report.format || "json"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{report.generated_by || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimestamp(report.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
