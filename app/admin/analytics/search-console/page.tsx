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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { MetricCard } from "@/components/admin/MetricCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { LineChart } from "@/components/charts/LineChart";
import {
  MousePointer, Eye, Search, TrendingUp, RefreshCw,
  AlertTriangle, Lightbulb, CheckCircle2,
} from "lucide-react";
import { useState, useMemo } from "react";

interface SCData {
  overview: {
    summary: { totalClicks: number; totalImpressions: number };
    timeline: { date: string; clicks: number; impressions: number; ctr: number; position: number }[];
  };
  topQueries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  topPages: { page: string; clicks: number; impressions: number; ctr: number; position: number }[];
}

type DateRange = "7d" | "30d" | "90d";

function getDateString(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

const DATE_RANGES: { value: DateRange; label: string; days: number }[] = [
  { value: "7d", label: "7 dní", days: 7 },
  { value: "30d", label: "30 dní", days: 30 },
  { value: "90d", label: "90 dní", days: 90 },
];

interface Insight {
  type: "warning" | "success" | "tip";
  title: string;
  description: string;
}

function generateSCInsights(data: SCData): Insight[] {
  const insights: Insight[] = [];
  const { topQueries, topPages, overview } = data;

  // High impressions + low CTR queries
  const highImprLowCtr = topQueries.filter(
    (q) => q.impressions > 100 && q.ctr < 3
  );
  if (highImprLowCtr.length > 0) {
    const examples = highImprLowCtr.slice(0, 3).map((q) => `"${q.query}"`).join(", ");
    insights.push({
      type: "warning",
      title: "Optimalizujte meta titulky",
      description: `${highImprLowCtr.length} dotazů má vysoké impressions ale nízké CTR (pod 3%). Příklady: ${examples}. Přepište meta titulky a popisy pro lepší proklikovost.`,
    });
  }

  // Low-hanging fruit: position 5-15
  const lowHanging = topQueries.filter(
    (q) => q.position >= 5 && q.position <= 15 && q.impressions > 50
  );
  if (lowHanging.length > 0) {
    const examples = lowHanging.slice(0, 3).map((q) => `"${q.query}" (poz. ${q.position.toFixed(1)})`).join(", ");
    insights.push({
      type: "tip",
      title: "Snadné výhry",
      description: `${lowHanging.length} dotazů je na pozicích 5–15 a lze je snadno posunout do top 5. Příklady: ${examples}. Vylepšete obsah a interní prolinkování.`,
    });
  }

  // Position >20 but high impressions — new content opportunity
  const newContentOpp = topQueries.filter(
    (q) => q.position > 20 && q.impressions > 200
  );
  if (newContentOpp.length > 0) {
    const examples = newContentOpp.slice(0, 3).map((q) => `"${q.query}"`).join(", ");
    insights.push({
      type: "tip",
      title: "Vytvořte nový obsah",
      description: `${newContentOpp.length} dotazů s vysokými impressions je na pozicích 20+. Příklady: ${examples}. Vytvořte dedikované stránky pro tyto témata.`,
    });
  }

  // Good average position
  const timeline = overview.timeline;
  if (timeline.length > 0) {
    const avgPos = timeline.reduce((sum, d) => sum + d.position, 0) / timeline.length;
    if (avgPos < 15) {
      insights.push({
        type: "success",
        title: "Dobrá průměrná pozice",
        description: `Průměrná pozice ${avgPos.toFixed(1)} je solidní. Zaměřte se na zvýšení CTR optimalizací meta tagů.`,
      });
    }
  }

  return insights;
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

export default function SearchConsolePage() {
  const { user } = useAdminAuth();
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const rangeConfig = DATE_RANGES.find((r) => r.value === dateRange)!;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["search-console-data", dateRange],
    queryFn: async () => {
      const startDate = getDateString(rangeConfig.days);
      const endDate = getDateString(0);
      const res = await fetch(
        `/api/analytics/search-console?startDate=${startDate}&endDate=${endDate}`
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as SCData;
    },
  });

  const insights = useMemo(() => (data ? generateSCInsights(data) : []), [data]);

  const chartData = useMemo(() => {
    if (!data?.overview?.timeline) return [];
    return data.overview.timeline
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        ...d,
        date: d.date.slice(5), // "MM-DD" format
      }));
  }, [data]);

  const avgCtr = useMemo(() => {
    if (!data?.overview?.timeline?.length) return 0;
    const t = data.overview.timeline;
    return t.reduce((sum, d) => sum + d.ctr, 0) / t.length;
  }, [data]);

  const avgPosition = useMemo(() => {
    if (!data?.overview?.timeline?.length) return 0;
    const t = data.overview.timeline;
    return t.reduce((sum, d) => sum + d.position, 0) / t.length;
  }, [data]);

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
          <Skeleton className="h-[300px] mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
          </div>
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
            <h1 className="text-2xl font-bold">Search Console</h1>
            <p className="text-muted-foreground">Výkon ve vyhledávání Google</p>
          </div>
          <EmptyState
            icon={Search}
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

  const summary = data?.overview?.summary;

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Search Console</h1>
            <p className="text-muted-foreground">Výkon ve vyhledávání Google</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border">
              {DATE_RANGES.map((r) => (
                <Button
                  key={r.value}
                  variant={dateRange === r.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDateRange(r.value)}
                  className="rounded-none first:rounded-l-md last:rounded-r-md"
                >
                  {r.label}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Kliky"
              value={summary.totalClicks.toLocaleString("cs-CZ")}
              icon={MousePointer}
            />
            <MetricCard
              title="Impressions"
              value={summary.totalImpressions.toLocaleString("cs-CZ")}
              icon={Eye}
            />
            <MetricCard
              title="Průměrné CTR"
              value={`${avgCtr.toFixed(1)}%`}
              icon={TrendingUp}
              trend={avgCtr >= 5 ? "up" : avgCtr >= 2 ? "neutral" : "down"}
            />
            <MetricCard
              title="Průměrná pozice"
              value={avgPosition.toFixed(1)}
              icon={Search}
              trend={avgPosition < 15 ? "up" : avgPosition < 30 ? "neutral" : "down"}
            />
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {insights.map((insight, i) => (
              <Alert
                key={i}
                className={
                  insight.type === "warning"
                    ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20"
                    : insight.type === "success"
                    ? "border-green-300 bg-green-50 dark:bg-green-950/20"
                    : "border-blue-300 bg-blue-50 dark:bg-blue-950/20"
                }
              >
                {insight.type === "warning" && (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
                {insight.type === "success" && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                {insight.type === "tip" && (
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                )}
                <AlertTitle>{insight.title}</AlertTitle>
                <AlertDescription>{insight.description}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Timeline Chart */}
        {chartData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Denní výkon ve vyhledávání</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={chartData}
                xKey="date"
                yKeys={[
                  { key: "clicks", color: "#2563eb", name: "Kliky" },
                  { key: "impressions", color: "#16a34a", name: "Impressions" },
                ]}
                height={300}
              />
            </CardContent>
          </Card>
        )}

        {/* Bottom grid: Top Queries + Top Pages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Queries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top dotazy</CardTitle>
            </CardHeader>
            <CardContent>
              {!data?.topQueries?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">Žádná data</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dotaz</TableHead>
                      <TableHead className="text-right">Kliky</TableHead>
                      <TableHead className="text-right">Impr.</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">Pozice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topQueries.map((q, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm max-w-[200px] truncate">
                          {q.query}
                        </TableCell>
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
              )}
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top stránky</CardTitle>
            </CardHeader>
            <CardContent>
              {!data?.topPages?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">Žádná data</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stránka</TableHead>
                      <TableHead className="text-right">Kliky</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">Pozice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topPages.map((p, i) => {
                      let shortUrl = p.page;
                      try {
                        shortUrl = new URL(p.page).pathname;
                      } catch {}
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-sm max-w-[200px] truncate" title={p.page}>
                            {shortUrl}
                          </TableCell>
                          <TableCell className="text-right">{p.clicks.toLocaleString("cs-CZ")}</TableCell>
                          <TableCell className="text-right">{p.ctr.toFixed(1)}%</TableCell>
                          <TableCell className="text-right">
                            <PositionBadge position={p.position} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
