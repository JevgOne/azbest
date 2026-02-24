"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { MetricCard } from "@/components/admin/MetricCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { ShoppingBag, Eye, MousePointer, DollarSign, TrendingUp, Package } from "lucide-react";
import { PlatformSyncButton } from "../_components/PlatformSyncButton";
import { SyncHistory } from "../_components/SyncHistory";

export default function HeurekaZboziPage() {
  const { user } = useAdminAuth();

  const { data: heurekaData, isLoading: heurekaLoading, refetch: refetchHeureka } = useQuery({
    queryKey: ["ads-platform", "heureka"],
    queryFn: async () => {
      const res = await fetch("/api/ads/platform/heureka");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  const { data: zboziData, isLoading: zboziLoading, refetch: refetchZbozi } = useQuery({
    queryKey: ["ads-platform", "zbozi"],
    queryFn: async () => {
      const res = await fetch("/api/ads/platform/zbozi");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  const isLoading = heurekaLoading || zboziLoading;

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

  const heurekaCampaign = heurekaData?.campaigns?.[0];
  const bids = heurekaData?.bids || [];

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Heureka & Zboží.cz</h1>
          <p className="text-muted-foreground">Správa produktových feedů a bidů</p>
        </div>

        <Tabs defaultValue="heureka">
          <TabsList>
            <TabsTrigger value="heureka" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Heureka
            </TabsTrigger>
            <TabsTrigger value="zbozi" className="gap-2">
              <Package className="h-4 w-4" />
              Zboží.cz
            </TabsTrigger>
          </TabsList>

          <TabsContent value="heureka" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <PlatformSyncButton platform="heureka" onSynced={() => refetchHeureka()} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard title="Zobrazení" value={(heurekaCampaign?.impressions || 0).toLocaleString("cs-CZ")} icon={Eye} />
              <MetricCard title="Kliknutí" value={(heurekaCampaign?.clicks || 0).toLocaleString("cs-CZ")} icon={MousePointer} />
              <MetricCard title="Útrata" value={`${(heurekaCampaign?.spend || 0).toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč`} icon={DollarSign} />
              <MetricCard title="ROAS" value={`${(heurekaCampaign?.roas || 0).toFixed(2)}x`} icon={TrendingUp} />
            </div>

            <h3 className="text-lg font-semibold">Produktové bidy</h3>
            {!bids.length ? (
              <EmptyState
                icon={ShoppingBag}
                title="Žádné bidy"
                description="Heureka bidy se zobrazí po synchronizaci."
              />
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produkt</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead className="text-right">Bid</TableHead>
                      <TableHead className="text-right">Kliknutí</TableHead>
                      <TableHead className="text-right">Útrata</TableHead>
                      <TableHead className="text-right">Konverze</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bids.slice(0, 30).map((bid: any) => (
                      <TableRow key={bid.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{bid.product_name}</TableCell>
                        <TableCell className="text-muted-foreground">{bid.category || "—"}</TableCell>
                        <TableCell className="text-right">{bid.current_bid.toFixed(2)} Kč</TableCell>
                        <TableCell className="text-right">{(bid.clicks || 0).toLocaleString("cs-CZ")}</TableCell>
                        <TableCell className="text-right">{(bid.spend || 0).toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč</TableCell>
                        <TableCell className="text-right">{(bid.conversions || 0).toLocaleString("cs-CZ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            <SyncHistory entries={heurekaData?.syncHistory || []} />
          </TabsContent>

          <TabsContent value="zbozi" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <PlatformSyncButton platform="zbozi" onSynced={() => refetchZbozi()} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(zboziData?.campaigns || []).length > 0 ? (
                <>
                  <MetricCard title="Zobrazení" value={(zboziData.campaigns[0]?.impressions || 0).toLocaleString("cs-CZ")} icon={Eye} />
                  <MetricCard title="Kliknutí" value={(zboziData.campaigns[0]?.clicks || 0).toLocaleString("cs-CZ")} icon={MousePointer} />
                  <MetricCard title="Útrata" value={`${(zboziData.campaigns[0]?.spend || 0).toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč`} icon={DollarSign} />
                  <MetricCard title="ROAS" value={`${(zboziData.campaigns[0]?.roas || 0).toFixed(2)}x`} icon={TrendingUp} />
                </>
              ) : (
                Array.from({ length: 4 }).map((_, i) => (
                  <MetricCard key={i} title={["Zobrazení", "Kliknutí", "Útrata", "ROAS"][i]} value="—" />
                ))
              )}
            </div>

            <EmptyState
              icon={Package}
              title="Zboží.cz Feed"
              description="Feed se generuje automaticky z produktů. Synchronizujte pro aktualizaci statistik."
            />

            <SyncHistory entries={zboziData?.syncHistory || []} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
