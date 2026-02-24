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
import { MetricCard } from "@/components/admin/MetricCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { TrendingUp, Search, RefreshCw, ExternalLink, MousePointer, Eye } from "lucide-react";
import { useMemo } from "react";
import Link from "next/link";

interface QueryData {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SCData {
  overview: {
    summary: { totalClicks: number; totalImpressions: number };
    timeline: any[];
  };
  topQueries: QueryData[];
  topPages: any[];
}

function PositionBadge({ position }: { position: number }) {
  const color =
    position < 10
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      : position < 20
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";

  return (
    <Badge variant="outline" className={`${color} border-0 font-mono`}>
      {position.toFixed(1)}
    </Badge>
  );
}

function getDateString(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

export default function SEOKeywordsPage() {
  const { user } = useAdminAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["seo-keywords"],
    queryFn: async () => {
      const startDate = getDateString(30);
      const endDate = getDateString(0);
      const res = await fetch(
        `/api/analytics/search-console?startDate=${startDate}&endDate=${endDate}`
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as SCData;
    },
  });

  const queries = data?.topQueries || [];

  const stats = useMemo(() => {
    if (!queries.length) return { total: 0, top10: 0, top20: 0, avgPos: 0 };
    const top10 = queries.filter((q) => q.position < 10).length;
    const top20 = queries.filter((q) => q.position < 20).length;
    const avgPos = queries.reduce((sum, q) => sum + q.position, 0) / queries.length;
    return { total: queries.length, top10, top20, avgPos };
  }, [queries]);

  if (isLoading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Keywords</h1>
            <p className="text-muted-foreground">Sledování pozic klíčových slov</p>
          </div>
          <EmptyState
            icon={TrendingUp}
            title="Chyba při načítání dat"
            description={(error as Error).message}
            action={
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Zkusit znovu
              </Button>
            }
          />
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
            <h1 className="text-2xl font-bold">Keywords</h1>
            <p className="text-muted-foreground">Sledování pozic klíčových slov (data ze Search Console, posledních 30 dní)</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/analytics/search-console">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Search Console
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Sledované dotazy"
            value={stats.total}
            icon={Search}
          />
          <MetricCard
            title="V top 10"
            value={stats.top10}
            icon={TrendingUp}
            trend={stats.top10 > 0 ? "up" : "neutral"}
            change={stats.total > 0 ? `${((stats.top10 / stats.total) * 100).toFixed(0)}%` : undefined}
          />
          <MetricCard
            title="V top 20"
            value={stats.top20}
            icon={MousePointer}
          />
          <MetricCard
            title="Průměrná pozice"
            value={stats.avgPos.toFixed(1)}
            icon={Eye}
            trend={stats.avgPos < 15 ? "up" : stats.avgPos < 30 ? "neutral" : "down"}
          />
        </div>

        {/* Keywords Table */}
        {!queries.length ? (
          <EmptyState
            icon={TrendingUp}
            title="Žádná keyword data"
            description="Připojte Google Search Console pro sledování pozic klíčových slov."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pozice klíčových slov</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Klíčové slovo</TableHead>
                    <TableHead className="text-right">Kliky</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Pozice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queries.map((q, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                      <TableCell className="font-medium">{q.query}</TableCell>
                      <TableCell className="text-right">{q.clicks.toLocaleString("cs-CZ")}</TableCell>
                      <TableCell className="text-right">{q.impressions.toLocaleString("cs-CZ")}</TableCell>
                      <TableCell className="text-right">{q.ctr.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        <PositionBadge position={q.position} />
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
