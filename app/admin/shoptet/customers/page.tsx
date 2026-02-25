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
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  ShoppingCart,
  Star,
} from "lucide-react";

interface Customer {
  id: number;
  shoptet_id: string | null;
  email: string;
  name: string | null;
  phone: string | null;
  total_orders: number;
  total_spent: number;
  first_order_at: number | null;
  last_order_at: number | null;
  rfm_recency: number | null;
  rfm_frequency: number | null;
  rfm_monetary: number | null;
  rfm_segment: string | null;
  rfm_score: string | null;
  sport_interests: string | null;
  tags: string | null;
  created_at: number;
  updated_at: number;
}

const PAGE_SIZE = 25;

const RFM_SEGMENTS = [
  { value: "champions", label: "Šampioni", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  { value: "loyal", label: "Loajální", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  { value: "potential", label: "Potenciální loajální", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300" },
  { value: "new", label: "Noví zákazníci", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
  { value: "promising", label: "Slibní", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300" },
  { value: "needs_attention", label: "Potřebují pozornost", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  { value: "about_to_sleep", label: "Usínající", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
  { value: "at_risk", label: "Ohrožení", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  { value: "hibernating", label: "Hibernující", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
  { value: "lost", label: "Ztracení", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
];

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
  }).format(new Date(timestamp * 1000));
}

function getSegmentInfo(segment: string | null) {
  if (!segment) return { label: "-", color: "bg-gray-100 text-gray-600" };
  const found = RFM_SEGMENTS.find((s) => s.value === segment.toLowerCase());
  return found || { label: segment, color: "bg-gray-100 text-gray-800" };
}

function parseJson(value: string | null): any[] {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

export default function ShoptetCustomersPage() {
  const { user } = useAdminAuth();
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [segment, setSegment] = useState<string>("all");
  const [page, setPage] = useState(0);

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
    if (segment && segment !== "all") params.set("segment", segment);
    return params.toString();
  }, [page, searchDebounced, segment]);

  const { data, isLoading } = useQuery({
    queryKey: ["shoptet-customers", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/shoptet/customers?${queryParams}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { customers: Customer[]; total: number };
    },
  });

  const customers = data?.customers || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Zákazníci</h1>
          <p className="text-muted-foreground">
            Přehled zákazníků ze Shoptet ({total} celkem)
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Hledat podle jména nebo e-mailu..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={segment} onValueChange={(v) => { setSegment(v); setPage(0); }}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="RFM Segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny segmenty</SelectItem>
                  {RFM_SEGMENTS.map((s) => (
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
              <Users className="h-5 w-5" />
              Zákazníci
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : customers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Žádní zákazníci"
                description="Zatím nebyli synchronizováni žádní zákazníci ze Shoptet. Spusťte synchronizaci v sekci Synchronizace."
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jméno</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead className="text-right">Objednávky</TableHead>
                      <TableHead className="text-right">Celková útrata</TableHead>
                      <TableHead>RFM Segment</TableHead>
                      <TableHead>RFM Skóre</TableHead>
                      <TableHead>Poslední obj.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => {
                      const segmentInfo = getSegmentInfo(customer.rfm_segment);
                      const tags = parseJson(customer.tags);
                      const sportInterests = parseJson(customer.sport_interests);

                      return (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="font-medium">
                              {customer.name || "-"}
                            </div>
                            {(tags.length > 0 || sportInterests.length > 0) && (
                              <div className="flex gap-1 mt-0.5 flex-wrap">
                                {sportInterests.slice(0, 2).map((interest: string, i: number) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-[10px] px-1 py-0"
                                  >
                                    {interest}
                                  </Badge>
                                ))}
                                {tags.slice(0, 2).map((tag: string, i: number) => (
                                  <Badge
                                    key={`t-${i}`}
                                    variant="secondary"
                                    className="text-[10px] px-1 py-0"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[200px]">
                                {customer.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {customer.phone ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                                {customer.phone}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">
                                {customer.total_orders}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(customer.total_spent)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`border-0 ${segmentInfo.color}`}
                            >
                              {segmentInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {customer.rfm_score ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="font-mono">
                                  {customer.rfm_score}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                            {(customer.rfm_recency != null || customer.rfm_frequency != null || customer.rfm_monetary != null) && (
                              <div className="text-[10px] text-muted-foreground">
                                R:{customer.rfm_recency ?? "-"} F:{customer.rfm_frequency ?? "-"} M:{customer.rfm_monetary ?? "-"}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(customer.last_order_at)}
                          </TableCell>
                        </TableRow>
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
