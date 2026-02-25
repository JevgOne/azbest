"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/admin/EmptyState";
import {
  RefreshCw,
  Package,
  ShoppingCart,
  Users,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  AlertTriangle,
  History,
} from "lucide-react";
import { useState } from "react";

interface SyncStatus {
  id: number;
  entity_type: string;
  status: string;
  items_synced: number;
  items_total: number;
  error_message: string | null;
  started_at: number | null;
  completed_at: number | null;
  created_at: number;
}

const ENTITY_LABELS: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  products: { label: "Produkty", icon: Package },
  orders: { label: "Objednávky", icon: ShoppingCart },
  customers: { label: "Zákazníci", icon: Users },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: {
    label: "Čekající",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    icon: Clock,
  },
  running: {
    label: "Probíhá",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    icon: Loader2,
  },
  completed: {
    label: "Dokončeno",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    icon: CheckCircle2,
  },
  failed: {
    label: "Chyba",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    icon: XCircle,
  },
};

function formatDate(timestamp: number | null): string {
  if (!timestamp) return "-";
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp * 1000));
}

function formatDuration(startedAt: number | null, completedAt: number | null): string {
  if (!startedAt || !completedAt) return "-";
  const diff = completedAt - startedAt;
  if (diff < 60) return `${diff} s`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ${diff % 60} s`;
  return `${Math.floor(diff / 3600)} hod ${Math.floor((diff % 3600) / 60)} min`;
}

function timeAgo(timestamp: number | null): string {
  if (!timestamp) return "nikdy";
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 60) return "právě teď";
  if (diff < 3600) return `před ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `před ${Math.floor(diff / 3600)} hod`;
  return `před ${Math.floor(diff / 86400)} dny`;
}

export default function ShoptetSyncPage() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();
  const [syncingType, setSyncingType] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["shoptet-sync-status"],
    queryFn: async () => {
      const res = await fetch("/api/shoptet/sync");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { latest: SyncStatus[]; history: SyncStatus[] };
    },
    refetchInterval: 5000, // Refresh every 5s while syncing
  });

  const syncMutation = useMutation({
    mutationFn: async (type: string) => {
      setSyncingType(type);
      const res = await fetch("/api/shoptet/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Synchronizace selhala");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shoptet-sync-status"] });
      setSyncingType(null);
    },
    onError: () => {
      setSyncingType(null);
    },
  });

  const latest = data?.latest || [];
  const history = data?.history || [];

  // Build a map for quick access
  const latestByType: Record<string, SyncStatus> = {};
  latest.forEach((s) => {
    latestByType[s.entity_type] = s;
  });

  const entityTypes = ["products", "orders", "customers"];

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Synchronizace</h1>
          <p className="text-muted-foreground">
            Správa synchronizace dat ze Shoptet
          </p>
        </div>

        {/* Sync error */}
        {syncMutation.isError && (
          <Card className="mb-4 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Chyba synchronizace: {(syncMutation.error as Error)?.message || "Neznámá chyba"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sync success */}
        {syncMutation.isSuccess && !syncingType && (
          <Card className="mb-4 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Synchronizace byla úspěšně dokončena.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entity sync cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {entityTypes.map((type) => {
              const config = ENTITY_LABELS[type];
              const status = latestByType[type];
              const statusConfig = status
                ? STATUS_CONFIG[status.status] || STATUS_CONFIG.pending
                : null;
              const Icon = config.icon;
              const isSyncing = syncingType === type;

              return (
                <Card key={type}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {config.label}
                      </div>
                      {statusConfig && (
                        <Badge
                          variant="outline"
                          className={`border-0 ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {status ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-muted-foreground">
                            Synchronizováno:
                          </span>
                          <span className="font-medium">
                            {status.items_synced}
                            {status.items_total > 0 &&
                              ` / ${status.items_total}`}
                          </span>
                          <span className="text-muted-foreground">
                            Poslední sync:
                          </span>
                          <span>
                            {timeAgo(status.completed_at || status.started_at)}
                          </span>
                          <span className="text-muted-foreground">Trvání:</span>
                          <span>
                            {formatDuration(
                              status.started_at,
                              status.completed_at
                            )}
                          </span>
                        </div>
                        {status.error_message && (
                          <div className="p-2 rounded-md bg-red-50 dark:bg-red-950/30 text-sm text-red-800 dark:text-red-300">
                            {status.error_message}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Zatím nebyla provedena žádná synchronizace.
                      </p>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => syncMutation.mutate(type)}
                      disabled={isSyncing || syncMutation.isPending}
                    >
                      {isSyncing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Synchronizuji...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Synchronizovat {config.label.toLowerCase()}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Sync history */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historie synchronizací
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <EmptyState
                icon={RefreshCw}
                title="Žádná historie"
                description="Zatím nebyla provedena žádná synchronizace. Klikněte na tlačítko výše pro spuštění."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Typ</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead className="text-right">Synchronizováno</TableHead>
                    <TableHead>Zahájeno</TableHead>
                    <TableHead>Dokončeno</TableHead>
                    <TableHead>Trvání</TableHead>
                    <TableHead>Chyba</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((sync) => {
                    const entityConfig = ENTITY_LABELS[sync.entity_type];
                    const statusCfg =
                      STATUS_CONFIG[sync.status] || STATUS_CONFIG.pending;
                    const StatusIcon = statusCfg.icon;

                    return (
                      <TableRow key={sync.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {entityConfig && (
                              <entityConfig.icon className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">
                              {entityConfig?.label || sync.entity_type}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`border-0 ${statusCfg.color}`}
                          >
                            <StatusIcon
                              className={`h-3 w-3 mr-1 ${sync.status === "running" ? "animate-spin" : ""}`}
                            />
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {sync.items_synced}
                          {sync.items_total > 0 && (
                            <span className="text-muted-foreground">
                              /{sync.items_total}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(sync.started_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(sync.completed_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDuration(sync.started_at, sync.completed_at)}
                        </TableCell>
                        <TableCell>
                          {sync.error_message ? (
                            <span
                              className="text-sm text-red-600 dark:text-red-400 max-w-[200px] truncate block"
                              title={sync.error_message}
                            >
                              {sync.error_message}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
