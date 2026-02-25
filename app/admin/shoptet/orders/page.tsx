"use client";

import { useState, useMemo } from "react";
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  ShoppingCart,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPin,
  CreditCard,
  Truck,
  Globe,
} from "lucide-react";

interface Order {
  id: number;
  shoptet_id: string;
  order_number: string;
  customer_email: string | null;
  customer_name: string | null;
  status: string;
  payment_method: string | null;
  shipping_method: string | null;
  total_price: number;
  currency: string;
  items: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  notes: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  created_at: number;
  updated_at: number;
  synced_at: number;
}

const PAGE_SIZE = 25;

const ORDER_STATUSES = [
  { value: "new", label: "Nová" },
  { value: "confirmed", label: "Potvrzená" },
  { value: "processing", label: "Zpracovává se" },
  { value: "shipped", label: "Odesláno" },
  { value: "delivered", label: "Doručeno" },
  { value: "completed", label: "Dokončeno" },
  { value: "cancelled", label: "Zrušeno" },
  { value: "returned", label: "Vráceno" },
  { value: "storno", label: "Storno" },
];

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  returned: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  storno: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

function formatCurrency(value: number, currency: string = "CZK"): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp * 1000));
}

function formatDateShort(timestamp: number): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
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

function parseJsonObj(value: string | null): Record<string, any> {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function getStatusLabel(status: string): string {
  const found = ORDER_STATUSES.find((s) => s.value === status.toLowerCase());
  return found ? found.label : status;
}

export default function ShoptetOrdersPage() {
  const { user } = useAdminAuth();
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      setSearchDebounced(value);
      setPage(0);
    }, 400);
    setDebounceTimer(timer);
  };

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(page * PAGE_SIZE));
    if (searchDebounced) params.set("search", searchDebounced);
    if (status && status !== "all") params.set("status", status);
    return params.toString();
  }, [page, searchDebounced, status]);

  const { data, isLoading } = useQuery({
    queryKey: ["shoptet-orders", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/shoptet/orders?${queryParams}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { orders: Order[]; total: number };
    },
  });

  const orders = data?.orders || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Objednávky</h1>
          <p className="text-muted-foreground">
            Přehled objednávek ze Shoptet ({total} celkem)
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Hledat podle čísla objednávky nebo zákazníka..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Stav" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny stavy</SelectItem>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
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
              Objednávky
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="Žádné objednávky"
                description="Zatím nebyly synchronizovány žádné objednávky ze Shoptet. Spusťte synchronizaci v sekci Synchronizace."
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30px]"></TableHead>
                      <TableHead>Číslo obj.</TableHead>
                      <TableHead>Zákazník</TableHead>
                      <TableHead>Stav</TableHead>
                      <TableHead className="text-right">Celkem</TableHead>
                      <TableHead>Platba</TableHead>
                      <TableHead>Doprava</TableHead>
                      <TableHead>Datum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <>
                        <TableRow
                          key={order.id}
                          className="cursor-pointer"
                          onClick={() =>
                            setExpandedId(
                              expandedId === order.id ? null : order.id
                            )
                          }
                        >
                          <TableCell>
                            {expandedId === order.id ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono font-medium">
                              {order.order_number}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {order.customer_name || "-"}
                            </div>
                            {order.customer_email && (
                              <span className="text-xs text-muted-foreground">
                                {order.customer_email}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`border-0 ${STATUS_STYLES[order.status.toLowerCase()] || "bg-gray-100 text-gray-800"}`}
                            >
                              {getStatusLabel(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(order.total_price, order.currency)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <CreditCard className="h-3 w-3 text-muted-foreground" />
                              {order.payment_method || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Truck className="h-3 w-3 text-muted-foreground" />
                              {order.shipping_method || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDateShort(order.created_at)}
                          </TableCell>
                        </TableRow>

                        {/* Expanded detail */}
                        {expandedId === order.id && (
                          <TableRow key={`${order.id}-detail`}>
                            <TableCell colSpan={8} className="bg-muted/30 p-4">
                              <OrderDetail order={order} />
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
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

function OrderDetail({ order }: { order: Order }) {
  const items = parseJson(order.items);
  const billingAddress = parseJsonObj(order.billing_address);
  const shippingAddress = parseJsonObj(order.shipping_address);
  const hasUtm =
    order.utm_source ||
    order.utm_medium ||
    order.utm_campaign ||
    order.utm_content ||
    order.utm_term;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Items */}
      <div className="md:col-span-2">
        <h4 className="font-semibold mb-3">Položky objednávky</h4>
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
                      ? formatCurrency(item.price * (item.amount || item.quantity || 1))
                      : "-"}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2 border-t mt-2">
              <span className="font-semibold">
                Celkem: {formatCurrency(order.total_price, order.currency)}
              </span>
            </div>
          </div>
        )}

        {order.notes && (
          <div className="mt-4">
            <h4 className="font-semibold mb-1">Poznámky</h4>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Right column: Addresses + UTM */}
      <div className="space-y-4">
        {/* Billing */}
        {Object.keys(billingAddress).length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Fakturační adresa
            </h4>
            <AddressBlock address={billingAddress} />
          </div>
        )}

        {/* Shipping */}
        {Object.keys(shippingAddress).length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-1">
              <Truck className="h-4 w-4" />
              Doručovací adresa
            </h4>
            <AddressBlock address={shippingAddress} />
          </div>
        )}

        {/* UTM */}
        {hasUtm && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-1">
              <Globe className="h-4 w-4" />
              UTM parametry
            </h4>
            <div className="grid grid-cols-2 gap-1 text-sm">
              {order.utm_source && (
                <>
                  <span className="text-muted-foreground">Source:</span>
                  <span>{order.utm_source}</span>
                </>
              )}
              {order.utm_medium && (
                <>
                  <span className="text-muted-foreground">Medium:</span>
                  <span>{order.utm_medium}</span>
                </>
              )}
              {order.utm_campaign && (
                <>
                  <span className="text-muted-foreground">Campaign:</span>
                  <span>{order.utm_campaign}</span>
                </>
              )}
              {order.utm_content && (
                <>
                  <span className="text-muted-foreground">Content:</span>
                  <span>{order.utm_content}</span>
                </>
              )}
              {order.utm_term && (
                <>
                  <span className="text-muted-foreground">Term:</span>
                  <span>{order.utm_term}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Meta info */}
        <div>
          <h4 className="font-semibold mb-2">Informace</h4>
          <div className="grid grid-cols-2 gap-1 text-sm">
            <span className="text-muted-foreground">Shoptet ID:</span>
            <span>{order.shoptet_id}</span>
            <span className="text-muted-foreground">Poslední sync:</span>
            <span>{formatDate(order.synced_at)}</span>
            <span className="text-muted-foreground">Aktualizováno:</span>
            <span>{formatDate(order.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddressBlock({ address }: { address: Record<string, any> }) {
  const name = address.name || address.fullName || address.company || "";
  const street = address.street || address.streetAddress || "";
  const city = address.city || "";
  const zip = address.zip || address.postalCode || "";
  const country = address.country || address.countryCode || "";
  const phone = address.phone || "";

  return (
    <div className="text-sm space-y-0.5">
      {name && <p className="font-medium">{name}</p>}
      {street && <p>{street}</p>}
      {(city || zip) && (
        <p>
          {zip} {city}
        </p>
      )}
      {country && <p>{country}</p>}
      {phone && <p className="text-muted-foreground">Tel: {phone}</p>}
    </div>
  );
}
