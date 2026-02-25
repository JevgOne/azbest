"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MetricCard } from "@/components/admin/MetricCard";
import { EmptyState } from "@/components/admin/EmptyState";
import {
  UserCheck, Users, RefreshCw, Loader2, Crown, Heart, AlertTriangle,
  UserX, UserPlus, TrendingUp, ShoppingCart, DollarSign,
} from "lucide-react";
import { useState } from "react";

interface Segment {
  id?: number;
  segment_name: string;
  customer_count: number;
  updated_at?: number;
}

const SEGMENT_CONFIG: Record<string, { label: string; color: string; icon: typeof Crown; description: string }> = {
  champions: {
    label: "Skveli zakaznici",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    icon: Crown,
    description: "Nakupuji casto, utrati hodne, nedavno nakoupili",
  },
  loyal: {
    label: "Loajalni",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    icon: Heart,
    description: "Pravidelni zakaznici s dobrym obratem",
  },
  potential: {
    label: "Potencialni",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    icon: TrendingUp,
    description: "Zakaznici s potencialem rustu",
  },
  new_customers: {
    label: "Novi zakaznici",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    icon: UserPlus,
    description: "Nedavno provedli prvni nakup",
  },
  at_risk: {
    label: "Ohrozeni",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    icon: AlertTriangle,
    description: "Drive aktivni, nyni se vzdaluji",
  },
  lost: {
    label: "Ztraceni",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    icon: UserX,
    description: "Delsi dobu nenakoupili",
  },
};

function formatDate(ts: number): string {
  if (!ts) return "\u2014";
  return new Date(ts * 1000).toLocaleDateString("cs-CZ", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatCZK(value: number): string {
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);
}

export default function RFMSegmentationPage() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();
  const [filterSegment, setFilterSegment] = useState<string>("all");

  const { data: segments, isLoading } = useQuery({
    queryKey: ["customer-segments"],
    queryFn: async () => {
      const res = await fetch("/api/customers/segmentation");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Segment[];
    },
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/customers/segmentation", { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-segments"] });
    },
  });

  const totalCustomers = segments?.reduce((sum, s) => sum + (Number(s.customer_count) || 0), 0) || 0;
  const championsCount = segments?.find((s) => s.segment_name === "champions")?.customer_count || 0;
  const atRiskCount = segments?.find((s) => s.segment_name === "at_risk")?.customer_count || 0;
  const loyalCount = segments?.find((s) => s.segment_name === "loyal")?.customer_count || 0;

  const filteredSegments = filterSegment === "all"
    ? segments
    : segments?.filter((s) => s.segment_name === filterSegment);

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">RFM Segmentace</h1>
            <p className="text-muted-foreground">Segmentace zakazniku podle RFM analyzy</p>
          </div>
          <Button
            onClick={() => recalculateMutation.mutate()}
            disabled={recalculateMutation.isPending}
          >
            {recalculateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Prepocitat RFM
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Celkem zakazniku"
            value={totalCustomers.toLocaleString("cs-CZ")}
            icon={Users}
            description="Vsichni segmentovani zakaznici"
          />
          <MetricCard
            title="Skveli zakaznici"
            value={Number(championsCount).toLocaleString("cs-CZ")}
            icon={Crown}
            trend="up"
            change={totalCustomers > 0 ? `${((Number(championsCount) / totalCustomers) * 100).toFixed(1)} % z celku` : "0 %"}
          />
          <MetricCard
            title="Loajalni zakaznici"
            value={Number(loyalCount).toLocaleString("cs-CZ")}
            icon={Heart}
            trend="up"
            change={totalCustomers > 0 ? `${((Number(loyalCount) / totalCustomers) * 100).toFixed(1)} % z celku` : "0 %"}
          />
          <MetricCard
            title="Ohrozeni zakaznici"
            value={Number(atRiskCount).toLocaleString("cs-CZ")}
            icon={AlertTriangle}
            trend="down"
            change={totalCustomers > 0 ? `${((Number(atRiskCount) / totalCustomers) * 100).toFixed(1)} % z celku` : "0 %"}
          />
        </div>

        {/* Recalculation success message */}
        {recalculateMutation.isSuccess && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-sm text-green-700 dark:text-green-300">
            RFM segmentace byla uspesne prepocitana.
          </div>
        )}
        {recalculateMutation.isError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-700 dark:text-red-300">
            Chyba pri prepoctu: {(recalculateMutation.error as Error)?.message}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Nacitani segmentu...</span>
          </div>
        ) : !segments?.length ? (
          <EmptyState
            icon={UserCheck}
            title="Zadna segmentacni data"
            description="Spustte prepocet RFM segmentace pro analyzu zakazniku."
            action={
              <Button onClick={() => recalculateMutation.mutate()} disabled={recalculateMutation.isPending}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Prepocitat RFM
              </Button>
            }
          />
        ) : (
          <>
            {/* Segment Distribution Cards */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Rozlozeni segmentu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(SEGMENT_CONFIG).map(([key, config]) => {
                    const segment = segments.find((s) => s.segment_name === key);
                    const count = Number(segment?.customer_count) || 0;
                    const percentage = totalCustomers > 0 ? ((count / totalCustomers) * 100).toFixed(1) : "0";
                    const Icon = config.icon;
                    return (
                      <div
                        key={key}
                        className="flex flex-col items-center p-4 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setFilterSegment(filterSegment === key ? "all" : key)}
                      >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${config.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-2xl font-bold">{count}</span>
                        <span className="text-xs text-muted-foreground text-center">{config.label}</span>
                        <span className="text-xs text-muted-foreground">{percentage} %</span>
                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-muted rounded-full mt-2">
                          <div
                            className={`h-full rounded-full ${config.color.split(" ")[0]}`}
                            style={{ width: `${Math.min(Number(percentage), 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Segments Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Prehled segmentu
                  </CardTitle>
                  <Select value={filterSegment} onValueChange={setFilterSegment}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrovat segment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Vsechny segmenty</SelectItem>
                      {Object.entries(SEGMENT_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Segment</TableHead>
                      <TableHead>Popis</TableHead>
                      <TableHead className="text-right">Pocet zakazniku</TableHead>
                      <TableHead className="text-right">Podil</TableHead>
                      <TableHead>Posledni aktualizace</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filteredSegments || []).map((segment) => {
                      const config = SEGMENT_CONFIG[segment.segment_name];
                      if (!config) return null;
                      const count = Number(segment.customer_count) || 0;
                      const percentage = totalCustomers > 0 ? ((count / totalCustomers) * 100).toFixed(1) : "0";
                      const Icon = config.icon;
                      return (
                        <TableRow key={segment.segment_name}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`${config.color} border-0`}>
                                <Icon className="h-3 w-3 mr-1" />
                                {config.label}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {config.description}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {count.toLocaleString("cs-CZ")}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm text-muted-foreground">{percentage} %</span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {segment.updated_at ? formatDate(segment.updated_at) : "\u2014"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(filteredSegments || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Zadne segmenty k zobrazeni
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
