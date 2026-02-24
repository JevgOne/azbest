"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { MetricCard } from "@/components/admin/MetricCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { Eye, MousePointer, DollarSign, TrendingUp, Target, Search } from "lucide-react";
import { PlatformSyncButton } from "../_components/PlatformSyncButton";
import { CampaignTable } from "../_components/CampaignTable";
import { DailyStatsChart } from "../_components/DailyStatsChart";
import { SyncHistory } from "../_components/SyncHistory";

export default function GoogleAdsPage() {
  const { user } = useAdminAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ads-platform", "google_ads"],
    queryFn: async () => {
      const res = await fetch("/api/ads/platform/google_ads");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  const campaigns = data?.campaigns || [];
  const totals = campaigns.reduce(
    (acc: any, c: any) => ({
      impressions: acc.impressions + (c.impressions || 0),
      clicks: acc.clicks + (c.clicks || 0),
      spend: acc.spend + (c.spend || 0),
      conversions: acc.conversions + (c.conversions || 0),
    }),
    { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
  );

  if (isLoading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-6" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
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
            <h1 className="text-2xl font-bold">Google Ads</h1>
            <p className="text-muted-foreground">Správa Google Ads kampaní</p>
          </div>
          <PlatformSyncButton platform="google_ads" onSynced={() => refetch()} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard title="Zobrazení" value={totals.impressions.toLocaleString("cs-CZ")} icon={Eye} />
          <MetricCard title="Kliknutí" value={totals.clicks.toLocaleString("cs-CZ")} icon={MousePointer} />
          <MetricCard title="Útrata" value={`${totals.spend.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč`} icon={DollarSign} />
          <MetricCard title="Konverze" value={totals.conversions.toLocaleString("cs-CZ")} icon={TrendingUp} />
        </div>

        {/* Daily chart */}
        <div className="mb-6">
          <DailyStatsChart data={data?.dailyStats || []} title="Denní útrata — Google Ads" metric="spend" />
        </div>

        {/* Campaigns */}
        <h2 className="text-lg font-semibold mb-3">Kampaně</h2>
        {!campaigns.length ? (
          <EmptyState
            icon={Target}
            title="Žádné kampaně"
            description="Synchronizujte Google Ads pro zobrazení kampaní."
          />
        ) : (
          <div className="mb-6">
            <CampaignTable campaigns={campaigns} />
          </div>
        )}

        {/* Keywords */}
        {data?.keywords?.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-3">Top klíčová slova</h2>
            <Card className="mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Klíčové slovo</TableHead>
                    <TableHead>Shoda</TableHead>
                    <TableHead className="text-right">Zobrazení</TableHead>
                    <TableHead className="text-right">Kliknutí</TableHead>
                    <TableHead className="text-right">Útrata</TableHead>
                    <TableHead className="text-right">Konverze</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.keywords.slice(0, 20).map((kw: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{kw.keyword}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{kw.match_type}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{(kw.impressions || 0).toLocaleString("cs-CZ")}</TableCell>
                      <TableCell className="text-right">{(kw.clicks || 0).toLocaleString("cs-CZ")}</TableCell>
                      <TableCell className="text-right">{(kw.spend || 0).toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč</TableCell>
                      <TableCell className="text-right">{(kw.conversions || 0).toLocaleString("cs-CZ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        )}

        {/* Sync history */}
        <SyncHistory entries={data?.syncHistory || []} />
      </main>
    </div>
  );
}
