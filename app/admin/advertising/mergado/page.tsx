"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricCard } from "@/components/admin/MetricCard";
import { RefreshCw, Layers, FileText, Settings2 } from "lucide-react";
import { PlatformSyncButton } from "../_components/PlatformSyncButton";
import { SyncHistory } from "../_components/SyncHistory";

export default function MergadoPage() {
  const { user } = useAdminAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ads-platform", "mergado"],
    queryFn: async () => {
      const res = await fetch("/api/ads/platform/mergado");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  const feeds = data?.feeds || [];
  const rules = data?.rules || [];

  if (isLoading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-6" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
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
            <h1 className="text-2xl font-bold">Mergado</h1>
            <p className="text-muted-foreground">Správa Mergado feedů a pravidel</p>
          </div>
          <PlatformSyncButton platform="mergado" onSynced={() => refetch()} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <MetricCard title="Feedy" value={feeds.length} icon={FileText} />
          <MetricCard title="Pravidla" value={rules.length} icon={Settings2} />
          <MetricCard
            title="Celkem produktů"
            value={feeds.reduce((s: number, f: any) => s + (f.products_count || 0), 0).toLocaleString("cs-CZ")}
            icon={Layers}
          />
        </div>

        {/* Feeds */}
        <h2 className="text-lg font-semibold mb-3">Feedy</h2>
        {!feeds.length ? (
          <EmptyState
            icon={RefreshCw}
            title="Žádné feedy"
            description="Synchronizujte Mergado pro zobrazení feedů."
          />
        ) : (
          <Card className="mb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Název</TableHead>
                  <TableHead>Formát</TableHead>
                  <TableHead className="text-right">Produktů</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Synchronizováno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeds.map((feed: any) => (
                  <TableRow key={feed.id}>
                    <TableCell className="font-medium">{feed.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs uppercase">{feed.format}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{(feed.products_count || 0).toLocaleString("cs-CZ")}</TableCell>
                    <TableCell>
                      <Badge variant={feed.status === "active" ? "default" : "secondary"}>
                        {feed.status === "active" ? "Aktivní" : feed.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {feed.synced_at ? new Date(feed.synced_at * 1000).toLocaleString("cs-CZ") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Rules */}
        {rules.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-3">Pravidla</h2>
            <Card className="mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pravidlo</TableHead>
                    <TableHead>Feed</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Priorita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule: any) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell className="text-muted-foreground">{rule.feed_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{rule.type || "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.status === "active" ? "default" : "secondary"}>
                          {rule.status === "active" ? "Aktivní" : rule.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{rule.priority}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        )}

        <SyncHistory entries={data?.syncHistory || []} />
      </main>
    </div>
  );
}
