"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/admin/EmptyState";
import { Loader2, Activity, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useState, useMemo } from "react";

interface ActivityLogEntry {
  id: number;
  user_id: string;
  user_email: string;
  user_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_name: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: number;
}

interface ActivityLogsResponse {
  logs: ActivityLogEntry[];
  total: number;
}

const ACTION_LABELS: Record<string, string> = {
  user_created: "Vytvořen uživatel",
  user_updated: "Upraven uživatel",
  user_deleted: "Smazán uživatel",
  user_login: "Přihlášení",
  user_logout: "Odhlášení",
  settings_updated: "Nastavení změněno",
  password_changed: "Heslo změněno",
  shoptet_sync: "Synchronizace Shoptet",
  product_updated: "Produkt aktualizován",
  order_updated: "Objednávka aktualizována",
  campaign_created: "Kampaň vytvořena",
  campaign_updated: "Kampaň upravena",
  campaign_paused: "Kampaň pozastavena",
  email_sent: "Email odeslán",
  push_sent: "Push notifikace odeslána",
  sms_sent: "SMS odeslána",
  social_post_created: "Příspěvek vytvořen",
  social_post_scheduled: "Příspěvek naplánován",
  social_post_published: "Příspěvek publikován",
  social_post_retried: "Příspěvek zopakován",
  social_analytics_synced: "Analytika synchronizována",
  blog_created: "Článek vytvořen",
  blog_updated: "Článek upraven",
  blog_deleted: "Článek smazán",
  image_generated: "Obrázek vygenerován",
  report_generated: "Zpráva vygenerována",
  promo_code_created: "Promo kód vytvořen",
  review_synced: "Recenze synchronizovány",
  seo_audit_run: "SEO audit spuštěn",
  keyword_tracked: "Klíčové slovo sledováno",
  ads_synced: "Reklamy synchronizovány",
  ads_sync_failed: "Chyba synchronizace reklam",
  ads_roas_calculated: "ROAS přepočítán",
};

const ACTION_COLORS: Record<string, string> = {
  user_login: "bg-green-100 text-green-800",
  user_logout: "bg-gray-100 text-gray-800",
  user_created: "bg-blue-100 text-blue-800",
  user_updated: "bg-yellow-100 text-yellow-800",
  user_deleted: "bg-red-100 text-red-800",
  settings_updated: "bg-purple-100 text-purple-800",
  password_changed: "bg-orange-100 text-orange-800",
  shoptet_sync: "bg-cyan-100 text-cyan-800",
  ads_sync_failed: "bg-red-100 text-red-800",
};

const PAGE_SIZE = 25;

function formatDateTime(ts: number): string {
  if (!ts) return "\u2014";
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(ts: number): string {
  if (!ts) return "\u2014";
  const now = Date.now();
  const diff = now - ts * 1000;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Právě teď";
  if (minutes < 60) return `Před ${minutes} min`;
  if (hours < 24) return `Před ${hours} hod`;
  if (days < 7) return `Před ${days} dny`;
  return formatDateTime(ts);
}

export default function ActivityLogsPage() {
  const { user } = useAdminAuth();

  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [searchUser, setSearchUser] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(page * PAGE_SIZE));
    if (actionFilter && actionFilter !== "all") {
      params.set("action", actionFilter);
    }
    return params.toString();
  }, [page, actionFilter]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-activity-logs", page, actionFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/activity-logs?${queryParams}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as ActivityLogsResponse;
    },
  });

  const filteredLogs = useMemo(() => {
    if (!data?.logs) return [];
    let logs = data.logs;

    // Client-side filter by user search
    if (searchUser.trim()) {
      const q = searchUser.toLowerCase().trim();
      logs = logs.filter(
        (log) =>
          (log.user_email && log.user_email.toLowerCase().includes(q)) ||
          (log.user_name && log.user_name.toLowerCase().includes(q))
      );
    }

    // Client-side filter by date range
    if (dateFrom) {
      const from = new Date(dateFrom).getTime() / 1000;
      logs = logs.filter((log) => log.created_at >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() / 1000 + 86400; // end of selected day
      logs = logs.filter((log) => log.created_at <= to);
    }

    return logs;
  }, [data?.logs, searchUser, dateFrom, dateTo]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const handleResetFilters = () => {
    setActionFilter("all");
    setSearchUser("");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  };

  const hasActiveFilters =
    actionFilter !== "all" || searchUser.trim() !== "" || dateFrom !== "" || dateTo !== "";

  // Group action types for the dropdown
  const actionGroups = [
    {
      label: "Uživatelé",
      actions: ["user_created", "user_updated", "user_deleted", "user_login", "user_logout", "password_changed"],
    },
    {
      label: "Nastavení",
      actions: ["settings_updated"],
    },
    {
      label: "Shoptet",
      actions: ["shoptet_sync", "product_updated", "order_updated"],
    },
    {
      label: "Sociální sítě",
      actions: ["social_post_created", "social_post_scheduled", "social_post_published", "social_post_retried", "social_analytics_synced"],
    },
    {
      label: "Blog",
      actions: ["blog_created", "blog_updated", "blog_deleted"],
    },
    {
      label: "Reklamy",
      actions: ["ads_synced", "ads_sync_failed", "ads_roas_calculated"],
    },
    {
      label: "SEO",
      actions: ["seo_audit_run", "keyword_tracked"],
    },
    {
      label: "Ostatní",
      actions: ["promo_code_created", "review_synced", "report_generated", "image_generated", "campaign_created", "campaign_updated", "campaign_paused", "email_sent", "push_sent", "sms_sent"],
    },
  ];

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Log aktivit</h1>
          <p className="text-muted-foreground">
            Přehled všech aktivit v administraci
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-4">
              {/* Action type filter */}
              <div className="flex flex-col gap-1.5 min-w-[220px]">
                <label className="text-sm font-medium text-muted-foreground">
                  Typ akce
                </label>
                <Select
                  value={actionFilter}
                  onValueChange={(val) => {
                    setActionFilter(val);
                    setPage(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Všechny akce" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všechny akce</SelectItem>
                    {actionGroups.map((group) => (
                      group.actions.map((action) => (
                        <SelectItem key={action} value={action}>
                          {ACTION_LABELS[action] || action}
                        </SelectItem>
                      ))
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User search */}
              <div className="flex flex-col gap-1.5 min-w-[220px]">
                <label className="text-sm font-medium text-muted-foreground">
                  Hledat uživatele
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Email nebo jméno..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Date from */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  Od
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-[160px]"
                />
              </div>

              {/* Date to */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  Do
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-[160px]"
                />
              </div>

              {/* Reset filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Zrušit filtry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center gap-2 py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Načítání...</span>
          </div>
        ) : isError ? (
          <EmptyState
            icon={Activity}
            title="Chyba při načítání"
            description="Nepodařilo se načíst log aktivit. Zkuste to prosím znovu."
            action={
              <Button variant="outline" onClick={() => window.location.reload()}>
                Zkusit znovu
              </Button>
            }
          />
        ) : !filteredLogs.length ? (
          <EmptyState
            icon={Activity}
            title="Žádné aktivity"
            description={
              hasActiveFilters
                ? "Pro zadané filtry nebyly nalezeny žádné záznamy. Zkuste upravit filtry."
                : "Zatím nebyly zaznamenány žádné aktivity."
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={handleResetFilters}>
                  Zrušit filtry
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Log aktivit
                  {data && (
                    <Badge variant="secondary" className="ml-2 font-normal">
                      {data.total} záznam{data.total === 1 ? "" : data.total < 5 ? "y" : "ů"}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Akce</TableHead>
                      <TableHead>Entita</TableHead>
                      <TableHead>Uživatel</TableHead>
                      <TableHead>Detaily</TableHead>
                      <TableHead>Čas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={ACTION_COLORS[log.action] || "bg-gray-50 text-gray-700"}
                          >
                            {ACTION_LABELS[log.action] || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.entity_name ? (
                            <div>
                              <span className="font-medium">{log.entity_name}</span>
                              {log.entity_type && (
                                <span className="text-muted-foreground text-xs ml-1">
                                  ({log.entity_type})
                                </span>
                              )}
                            </div>
                          ) : log.entity_type ? (
                            <span className="text-muted-foreground">{log.entity_type}</span>
                          ) : (
                            <span className="text-muted-foreground">{"\u2014"}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {log.user_name || "\u2014"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {log.user_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                          {log.details || "\u2014"}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          <div title={formatDateTime(log.created_at)}>
                            {formatRelativeTime(log.created_at)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateTime(log.created_at)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Stránka {page + 1} z {totalPages} ({data!.total} záznamů)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Předchozí
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Další
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
