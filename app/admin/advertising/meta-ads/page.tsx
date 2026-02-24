"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/admin/MetricCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { Eye, MousePointer, DollarSign, TrendingUp, Share2 } from "lucide-react";
import { PlatformSyncButton } from "../_components/PlatformSyncButton";
import { CampaignTable } from "../_components/CampaignTable";
import { DailyStatsChart } from "../_components/DailyStatsChart";
import { SyncHistory } from "../_components/SyncHistory";

export default function MetaAdsPage() {
  const { user } = useAdminAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ads-platform", "meta_ads"],
    queryFn: async () => {
      const res = await fetch("/api/ads/platform/meta_ads");
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
            <h1 className="text-2xl font-bold">Meta Ads</h1>
            <p className="text-muted-foreground">Správa Facebook & Instagram kampaní</p>
          </div>
          <PlatformSyncButton platform="meta_ads" onSynced={() => refetch()} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard title="Zobrazení" value={totals.impressions.toLocaleString("cs-CZ")} icon={Eye} />
          <MetricCard title="Kliknutí" value={totals.clicks.toLocaleString("cs-CZ")} icon={MousePointer} />
          <MetricCard title="Útrata" value={`${totals.spend.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč`} icon={DollarSign} />
          <MetricCard title="Konverze" value={totals.conversions.toLocaleString("cs-CZ")} icon={TrendingUp} />
        </div>

        <div className="mb-6">
          <DailyStatsChart data={data?.dailyStats || []} title="Denní útrata — Meta Ads" metric="spend" />
        </div>

        <h2 className="text-lg font-semibold mb-3">Kampaně</h2>
        {!campaigns.length ? (
          <EmptyState
            icon={Share2}
            title="Žádné kampaně"
            description="Synchronizujte Meta Ads pro zobrazení Facebook a Instagram kampaní."
          />
        ) : (
          <div className="mb-6">
            <CampaignTable campaigns={campaigns} />
          </div>
        )}

        <SyncHistory entries={data?.syncHistory || []} />
      </main>
    </div>
  );
}
