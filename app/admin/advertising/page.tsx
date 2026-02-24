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
import {
  Eye, MousePointer, DollarSign, TrendingUp, RefreshCw, Megaphone,
  CheckCircle, XCircle, Minus,
} from "lucide-react";
import { useState } from "react";
import type { UnifiedPlatformStats, UnifiedDailyStats } from "@/types/ads";
import { PLATFORM_LABELS, PLATFORM_COLORS } from "@/types/ads";

interface OverviewData {
  platformStats: UnifiedPlatformStats[];
  dailyStats: UnifiedDailyStats[];
  topCampaigns: any[];
}

export default function AdvertisingOverviewPage() {
  const { user } = useAdminAuth();
  const [syncing, setSyncing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ads-overview"],
    queryFn: async () => {
      const res = await fetch("/api/ads/overview");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as OverviewData;
    },
  });

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      await fetch("/api/ads/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      await refetch();
    } finally {
      setSyncing(false);
    }
  };

  const totals = data?.platformStats?.reduce(
    (acc, p) => ({
      impressions: acc.impressions + p.impressions,
      clicks: acc.clicks + p.clicks,
      spend: acc.spend + p.spend,
      conversions: acc.conversions + p.conversions,
      revenue: acc.revenue + p.revenue,
    }),
    { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 }
  ) || { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 };

  const overallRoas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

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
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Přehled reklamy</h1>
            <p className="text-muted-foreground">
              Souhrnné statistiky ze všech reklamních platforem
            </p>
          </div>
          <Button onClick={handleSyncAll} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Synchronizuji..." : "Synchronizovat vše"}
          </Button>
        </div>

        {/* Total metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <MetricCard title="Zobrazení" value={totals.impressions.toLocaleString("cs-CZ")} icon={Eye} />
          <MetricCard title="Kliknutí" value={totals.clicks.toLocaleString("cs-CZ")} icon={MousePointer} />
          <MetricCard
            title="Útrata"
            value={`${totals.spend.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč`}
            icon={DollarSign}
          />
          <MetricCard title="Konverze" value={totals.conversions.toLocaleString("cs-CZ")} icon={TrendingUp} />
          <MetricCard
            title="ROAS"
            value={overallRoas.toFixed(2) + "x"}
            icon={TrendingUp}
            trend={overallRoas >= 3 ? "up" : overallRoas >= 1 ? "neutral" : "down"}
            change={overallRoas >= 3 ? "Dobrý" : overallRoas >= 1 ? "OK" : "Nízký"}
          />
        </div>

        {/* Platform cards */}
        <h2 className="text-lg font-semibold mb-3">Platformy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {data?.platformStats?.map((p) => (
            <Card key={p.platform}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PLATFORM_COLORS[p.platform] }}
                    />
                    {p.label}
                  </CardTitle>
                  {p.connected ? (
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Připojeno
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Minus className="h-3 w-3 mr-1" />
                      Nepřipojeno
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Útrata</p>
                    <p className="font-medium">{p.spend.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Kliknutí</p>
                    <p className="font-medium">{p.clicks.toLocaleString("cs-CZ")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Konverze</p>
                    <p className="font-medium">{p.conversions.toLocaleString("cs-CZ")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ROAS</p>
                    <p className="font-medium">{p.roas.toFixed(2)}x</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {p.campaignCount} kampaní
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Top campaigns table */}
        <h2 className="text-lg font-semibold mb-3">Top kampaně dle útraty</h2>
        {!data?.topCampaigns?.length ? (
          <EmptyState
            icon={Megaphone}
            title="Žádná data"
            description="Synchronizujte reklamní platformy pro zobrazení kampaní."
            action={
              <Button variant="outline" onClick={handleSyncAll} disabled={syncing}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Synchronizovat
              </Button>
            }
          />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kampaň</TableHead>
                  <TableHead>Platforma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Zobrazení</TableHead>
                  <TableHead className="text-right">Kliknutí</TableHead>
                  <TableHead className="text-right">Útrata</TableHead>
                  <TableHead className="text-right">Konverze</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topCampaigns.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {PLATFORM_LABELS[c.platform as keyof typeof PLATFORM_LABELS] || c.platform}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === "active" ? "default" : "secondary"}>
                        {c.status === "active" ? "Aktivní" : "Pozastavena"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{(c.impressions || 0).toLocaleString("cs-CZ")}</TableCell>
                    <TableCell className="text-right">{(c.clicks || 0).toLocaleString("cs-CZ")}</TableCell>
                    <TableCell className="text-right">{(c.spend || 0).toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč</TableCell>
                    <TableCell className="text-right">{(c.conversions || 0).toLocaleString("cs-CZ")}</TableCell>
                    <TableCell className="text-right">{c.spend > 0 ? ((c.revenue || 0) / c.spend).toFixed(2) : "—"}x</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>
    </div>
  );
}
