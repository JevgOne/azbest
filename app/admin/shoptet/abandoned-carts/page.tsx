"use client";

import { useState, useMemo } from "react";
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricCard } from "@/components/admin/MetricCard";
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Mail,
  TrendingUp,
  DollarSign,
  RotateCcw,
} from "lucide-react";

interface AbandonedCart {
  id: number;
  session_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  items: string;
  total_price: number;
  currency: string;
  recovered: number;
  recovery_email_sent: number;
  abandoned_at: number;
  recovered_at: number | null;
  created_at: number;
}

interface CartMetrics {
  totalAbandoned: number;
  recoveredCount: number;
  lostRevenue: number;
  recoveredRevenue: number;
}

const PAGE_SIZE = 25;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(timestamp: number | null): string {
  if (!timestamp) return "-";
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp * 1000));
}

function parseJson(value: string | null): any[] {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function timeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 60) return "právě teď";
  if (diff < 3600) return `před ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `před ${Math.floor(diff / 3600)} hod`;
  if (diff < 604800) return `před ${Math.floor(diff / 86400)} dny`;
  return formatDate(timestamp);
}

export default function ShoptetAbandonedCartsPage() {
  const { user } = useAdminAuth();
  const [recovered, setRecovered] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(page * PAGE_SIZE));
    if (recovered !== "all") params.set("recovered", recovered);
    return params.toString();
  }, [page, recovered]);

  const { data, isLoading } = useQuery({
    queryKey: ["shoptet-abandoned-carts", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/shoptet/abandoned-carts?${queryParams}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as {
        carts: AbandonedCart[];
        total: number;
        metrics: CartMetrics;
      };
    },
    refetchInterval: 60000,
  });

  const carts = data?.carts || [];
  const total = data?.total || 0;
  const metrics = data?.metrics || {
    totalAbandoned: 0,
    recoveredCount: 0,
    lostRevenue: 0,
    recoveredRevenue: 0,
  };
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const recoveryRate =
    metrics.totalAbandoned > 0
      ? ((metrics.recoveredCount / metrics.totalAbandoned) * 100).toFixed(1)
      : "0";

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Opuštěné košíky</h1>
          <p className="text-muted-foreground">
            Sledování opuštěných košíků a jejich obnovy
          </p>
        </div>

        {/* Metric cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Opuštěné košíky celkem"
              value={metrics.totalAbandoned}
              icon={ShoppingCart}
              description="Celkový počet opuštěných košíků"
            />
            <MetricCard
              title="Obnovené košíky"
              value={metrics.recoveredCount}
              icon={CheckCircle2}
              description={`${recoveryRate} % míra obnovy`}
              trend={Number(recoveryRate) > 10 ? "up" : "neutral"}
              change={`${recoveryRate} %`}
            />
            <MetricCard
              title="Ztracené tržby"
              value={formatCurrency(metrics.lostRevenue)}
              icon={AlertTriangle}
              description="Neobnovené košíky"
              trend="down"
            />
            <MetricCard
              title="Obnovené tržby"
              value={formatCurrency(metrics.recoveredRevenue)}
              icon={DollarSign}
              description="Úspěšně obnovené"
              trend="up"
            />
          </div>
        )}

        {/* Filter */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={recovered} onValueChange={(v) => { setRecovered(v); setPage(0); }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Stav obnovy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny košíky</SelectItem>
                  <SelectItem value="0">Neobnovené</SelectItem>
                  <SelectItem value="1">Obnovené</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Opuštěné košíky
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : carts.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="Žádné opuštěné košíky"
                description="Zatím nebyly zaznamenány žádné opuštěné košíky."
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30px]"></TableHead>
                      <TableHead>Zákazník</TableHead>
                      <TableHead className="text-right">Položek</TableHead>
                      <TableHead className="text-right">Celkem</TableHead>
                      <TableHead>Opuštěno</TableHead>
                      <TableHead>E-mail odeslán</TableHead>
                      <TableHead>Stav</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carts.map((cart) => {
                      const items = parseJson(cart.items);
                      return (
                        <>
                          <TableRow
                            key={cart.id}
                            className="cursor-pointer"
                            onClick={() =>
                              setExpandedId(
                                expandedId === cart.id ? null : cart.id
                              )
                            }
                          >
                            <TableCell>
                              {expandedId === cart.id ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {cart.customer_name || "Anonymní"}
                              </div>
                              {cart.customer_email && (
                                <span className="text-xs text-muted-foreground">
                                  {cart.customer_email}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">
                                {items.length} {items.length === 1 ? "položka" : items.length < 5 ? "položky" : "položek"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(cart.total_price)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{timeAgo(cart.abandoned_at)}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(cart.abandoned_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {cart.recovery_email_sent ? (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-0"
                                >
                                  <Mail className="h-3 w-3 mr-1" />
                                  Odesláno
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  Ne
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {cart.recovered ? (
                                <Badge
                                  variant="outline"
                                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-0"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Obnoveno
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-0"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Neobnoveno
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>

                          {/* Expanded detail */}
                          {expandedId === cart.id && (
                            <TableRow key={`${cart.id}-detail`}>
                              <TableCell colSpan={7} className="bg-muted/30 p-4">
                                <CartDetail cart={cart} />
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Zobrazeno {page * PAGE_SIZE + 1}–
                    {Math.min((page + 1) * PAGE_SIZE, total)} z {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Předchozí
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      {page + 1} / {totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(page + 1)}
                    >
                      Další
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function CartDetail({ cart }: { cart: AbandonedCart }) {
  const items = parseJson(cart.items);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-2">Položky košíku</h4>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádné položky</p>
        ) : (
          <div className="space-y-2">
            {items.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-md border text-sm"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium">
                    {item.name || item.productName || `Položka ${idx + 1}`}
                  </span>
                  {item.code && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      ({item.code})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {item.amount || item.quantity || 1}x
                  </span>
                  <span className="font-medium min-w-[80px] text-right">
                    {item.price != null
                      ? formatCurrency(
                          item.price * (item.amount || item.quantity || 1)
                        )
                      : "-"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground block">Session ID</span>
          <span className="font-mono text-xs">{cart.session_id || "-"}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Vytvořeno</span>
          <span>{formatDate(cart.created_at)}</span>
        </div>
        {cart.recovered_at && (
          <div>
            <span className="text-muted-foreground block">Obnoveno</span>
            <span>{formatDate(cart.recovered_at)}</span>
          </div>
        )}
        <div>
          <span className="text-muted-foreground block">Měna</span>
          <span>{cart.currency}</span>
        </div>
      </div>
    </div>
  );
}
