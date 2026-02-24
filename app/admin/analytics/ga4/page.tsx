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
import { PieChart } from "@/components/charts/PieChart";
import {
  Users, Activity, Eye, Timer, TrendingDown, RefreshCw, BarChart3,
  AlertTriangle, Lightbulb, CheckCircle2, ArrowRight,
} from "lucide-react";
import { useState, useMemo } from "react";

interface GA4Data {
  overview: {
    summary: { totalUsers: number; totalSessions: number; totalPageViews: number };
    timeline: { date: string; users: number; sessions: number; pageViews: number }[];
  };
  topPages: { path: string; title: string; pageViews: number }[];
  trafficSources: { source: string; sessions: number; users: number }[];
}

type DateRange = "7d" | "30d" | "90d";

const DATE_RANGES: { value: DateRange; label: string; apiValue: string }[] = [
  { value: "7d", label: "7 dní", apiValue: "7daysAgo" },
  { value: "30d", label: "30 dní", apiValue: "30daysAgo" },
  { value: "90d", label: "90 dní", apiValue: "90daysAgo" },
];

interface Insight {
  type: "warning" | "success" | "tip";
  title: string;
  description: string;
}

function generateGA4Insights(data: GA4Data): Insight[] {
  const insights: Insight[] = [];
  const { overview, topPages, trafficSources } = data;
  const timeline = overview.timeline;

  // Bounce rate check - approximate from sessions vs pageviews
  const { totalSessions, totalPageViews } = overview.summary;
  if (totalSessions > 0) {
    const pagesPerSession = totalPageViews / totalSessions;
    if (pagesPerSession < 1.5) {
      insights.push({
        type: "warning",
        title: "Slabá angažovanost",
        description: `Průměrně ${pagesPerSession.toFixed(1)} stránek na session. Zvažte optimalizaci landing pages — přidejte interní odkazy a vylepšete obsah pro snížení bounce rate.`,
      });
    }
  }

  // Organic traffic check
  const totalTrafficSessions = trafficSources.reduce((sum, s) => sum + s.sessions, 0);
  const organicSource = trafficSources.find(
    (s) => s.source?.toLowerCase().includes("organic")
  );
  const organicShare = totalTrafficSessions > 0 && organicSource
    ? (organicSource.sessions / totalTrafficSessions) * 100
    : 0;

  if (organicShare < 30 && totalTrafficSessions > 0) {
    insights.push({
      type: "tip",
      title: "Nízký podíl organického provozu",
      description: `Organické vyhledávání tvoří pouze ${organicShare.toFixed(0)}% návštěvnosti. Investujte do SEO obsahu — blogové články, optimalizace meta tagů a budování zpětných odkazů.`,
    });
  } else if (organicShare >= 50) {
    insights.push({
      type: "success",
      title: "Silný organický provoz",
      description: `Organické vyhledávání tvoří ${organicShare.toFixed(0)}% návštěvnosti. SEO strategie funguje dobře.`,
    });
  }

  // Top pages without good engagement
  if (topPages.length > 0 && totalPageViews > 0) {
    const topPage = topPages[0];
    const topPageShare = (topPage.pageViews / totalPageViews) * 100;
    if (topPageShare > 40) {
      insights.push({
        type: "tip",
        title: "Přidejte CTA na nejnavštěvovanější stránky",
        description: `Stránka "${topPage.path}" tvoří ${topPageShare.toFixed(0)}% všech zobrazení. Ujistěte se, že obsahuje jasné CTA a provede uživatele k dalšímu kroku.`,
      });
    }
  }

  // Week-over-week trend
  if (timeline.length >= 14) {
    const recentWeek = timeline.slice(-7);
    const previousWeek = timeline.slice(-14, -7);
    const recentSum = recentWeek.reduce((sum, d) => sum + d.users, 0);
    const previousSum = previousWeek.reduce((sum, d) => sum + d.users, 0);

    if (previousSum > 0) {
      const changePercent = ((recentSum - previousSum) / previousSum) * 100;
      if (changePercent < -15) {
        insights.push({
          type: "warning",
          title: "Pokles návštěvnosti",
          description: `Návštěvnost klesla o ${Math.abs(changePercent).toFixed(0)}% oproti předchozímu týdnu. Zkontrolujte reklamní kampaně a zda nedošlo k technickým problémům.`,
        });
      } else if (changePercent > 15) {
        insights.push({
          type: "success",
          title: "Růst návštěvnosti",
          description: `Návštěvnost vzrostla o ${changePercent.toFixed(0)}% oproti předchozímu týdnu. Pokračujte v tom, co funguje.`,
        });
      }
    }
  }

  return insights;
}

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  return `${dateStr.slice(6, 8)}.${dateStr.slice(4, 6)}.`;
}

export default function GA4Page() {
  const { user } = useAdminAuth();
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const rangeConfig = DATE_RANGES.find((r) => r.value === dateRange)!;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["ga4-data", dateRange],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/ga4?startDate=${rangeConfig.apiValue}&endDate=today`
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as GA4Data;
    },
  });

  const insights = useMemo(() => (data ? generateGA4Insights(data) : []), [data]);

  const chartData = useMemo(() => {
    if (!data?.overview?.timeline) return [];
    return data.overview.timeline
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        ...d,
        date: formatDate(d.date),
      }));
  }, [data]);

  const pieData = useMemo(() => {
    if (!data?.trafficSources) return [];
    return data.trafficSources.map((s) => ({
      name: s.source || "Neznámý",
      value: s.sessions,
    }));
  }, [data]);

  const totalTrafficSessions = data?.trafficSources?.reduce(
    (sum, s) => sum + s.sessions, 0
  ) || 0;

  if (isLoading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[300px] mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
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
            <h1 className="text-2xl font-bold">Google Analytics</h1>
            <p className="text-muted-foreground">Přehled návštěvnosti a konverzí</p>
          </div>
          <EmptyState
            icon={BarChart3}
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
            <h1 className="text-2xl font-bold">Google Analytics</h1>
            <p className="text-muted-foreground">Přehled návštěvnosti a konverzí</p>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <MetricCard
              title="Uživatelé"
              value={summary.totalUsers.toLocaleString("cs-CZ")}
              icon={Users}
            />
            <MetricCard
              title="Sessions"
              value={summary.totalSessions.toLocaleString("cs-CZ")}
              icon={Activity}
            />
            <MetricCard
              title="Zobrazení stránek"
              value={summary.totalPageViews.toLocaleString("cs-CZ")}
              icon={Eye}
            />
            <MetricCard
              title="Str./Session"
              value={
                summary.totalSessions > 0
                  ? (summary.totalPageViews / summary.totalSessions).toFixed(1)
                  : "—"
              }
              icon={TrendingDown}
              trend={
                summary.totalSessions > 0 &&
                summary.totalPageViews / summary.totalSessions >= 2
                  ? "up"
                  : "neutral"
              }
            />
            <MetricCard
              title="Prům. doba"
              value="—"
              description="Dostupné v GA4 Explore"
              icon={Timer}
            />
          </div>
        )}

        {/* Insights / Recommendations */}
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
              <CardTitle className="text-base">Denní návštěvnost</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={chartData}
                xKey="date"
                yKeys={[
                  { key: "users", color: "#2563eb", name: "Uživatelé" },
                  { key: "sessions", color: "#16a34a", name: "Sessions" },
                ]}
                height={300}
              />
            </CardContent>
          </Card>
        )}

        {/* Bottom grid: Top Pages + Traffic Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <TableHead className="text-right">Zobrazení</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topPages.map((page, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {i < 3 && (
                              <Badge variant="outline" className="text-xs w-5 h-5 flex items-center justify-center p-0">
                                {i + 1}
                              </Badge>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate max-w-[250px]">{page.path}</p>
                              {page.title && (
                                <p className="text-xs text-muted-foreground truncate max-w-[250px]">{page.title}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {page.pageViews.toLocaleString("cs-CZ")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Zdroje návštěvnosti</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Žádná data</p>
              ) : (
                <>
                  <PieChart data={pieData} height={220} />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Zdroj</TableHead>
                        <TableHead className="text-right">Sessions</TableHead>
                        <TableHead className="text-right">Podíl</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.trafficSources?.map((source, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{source.source}</TableCell>
                          <TableCell className="text-right">
                            {source.sessions.toLocaleString("cs-CZ")}
                          </TableCell>
                          <TableCell className="text-right">
                            {totalTrafficSessions > 0
                              ? ((source.sessions / totalTrafficSessions) * 100).toFixed(1)
                              : 0}
                            %
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
