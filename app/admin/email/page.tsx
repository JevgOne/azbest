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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricCard } from "@/components/admin/MetricCard";
import {
  Mail,
  Search,
  Plus,
  Loader2,
  Send,
  Users,
  BarChart3,
  MousePointerClick,
  Eye,
  Zap,
  FileText,
  UserPlus,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EmailCampaign {
  id: number;
  ecomail_id: string | null;
  name: string;
  subject: string;
  template_id: string | null;
  list_id: string | null;
  status: string;
  sent_count: number;
  open_count: number;
  click_count: number;
  unsubscribe_count: number;
  bounce_count: number;
  open_rate: number;
  click_rate: number;
  scheduled_at: number | null;
  sent_at: number | null;
  created_at: number;
  updated_at: number;
}

interface EmailTemplate {
  id: number;
  name: string;
  subject?: string;
  html?: string;
  created_at?: number;
}

interface EmailAutomation {
  id: number;
  name: string;
  trigger?: string;
  status?: string;
  emails_sent?: number;
  created_at: number;
}

interface EmailSubscriber {
  id: number;
  email: string;
  name?: string;
  status?: string;
  subscribed_at: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 25;

const CAMPAIGN_STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  sending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  sent: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  draft: "Koncept",
  scheduled: "Naplanovano",
  sending: "Odesila se",
  sent: "Odeslano",
  failed: "Chyba",
};

const AUTOMATION_STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const AUTOMATION_STATUS_LABELS: Record<string, string> = {
  active: "Aktivni",
  paused: "Pozastaveno",
  inactive: "Neaktivni",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtDate(ts: number | null): string {
  if (!ts) return "\u2014";
  return new Date(ts * 1000).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(ts: number | null): string {
  if (!ts) return "\u2014";
  return new Date(ts * 1000).toLocaleString("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtPercent(value: number | null | undefined): string {
  if (value == null) return "0 %";
  return `${(Number(value) * (Number(value) > 1 ? 1 : 100)).toFixed(1)} %`;
}

function fmtNumber(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("cs-CZ");
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function EmailMarketingPage() {
  const { user } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [campaignSearch, setCampaignSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  /* ---------- Campaigns query ---------- */

  const campaignParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(page * PAGE_SIZE));
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    return params.toString();
  }, [page, statusFilter]);

  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ["email-campaigns", campaignParams],
    queryFn: async () => {
      const res = await fetch(`/api/email/campaigns?${campaignParams}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { campaigns: EmailCampaign[]; total: number };
    },
  });

  /* ---------- Subscribers query ---------- */

  const { data: subscribersData, isLoading: subscribersLoading } = useQuery({
    queryKey: ["email-subscribers"],
    queryFn: async () => {
      const res = await fetch("/api/email/subscribers?limit=50");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { subscribers: EmailSubscriber[]; total: number };
    },
  });

  /* ---------- Templates query ---------- */

  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const res = await fetch("/api/email/templates");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return (json.data || []) as EmailTemplate[];
    },
  });

  /* ---------- Automations query ---------- */

  const { data: automationsData, isLoading: automationsLoading } = useQuery({
    queryKey: ["email-automations"],
    queryFn: async () => {
      const res = await fetch("/api/email/automations");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return (json.data || []) as EmailAutomation[];
    },
  });

  /* ---------- Derived data ---------- */

  const campaigns = campaignsData?.campaigns || [];
  const totalCampaigns = campaignsData?.total || 0;
  const totalPages = Math.ceil(totalCampaigns / PAGE_SIZE);

  const filteredCampaigns = useMemo(() => {
    if (!campaignSearch) return campaigns;
    const q = campaignSearch.toLowerCase();
    return campaigns.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.subject?.toLowerCase().includes(q)
    );
  }, [campaigns, campaignSearch]);

  const subscribers = subscribersData?.subscribers || [];
  const totalSubscribers = subscribersData?.total || 0;

  const templates = templatesData || [];
  const automations = automationsData || [];

  /* ---------- KPI metrics ---------- */

  const avgOpenRate = useMemo(() => {
    const sent = campaigns.filter((c) => c.status === "sent" && c.open_rate != null);
    if (!sent.length) return 0;
    const sum = sent.reduce((acc, c) => {
      const rate = Number(c.open_rate);
      return acc + (rate > 1 ? rate / 100 : rate);
    }, 0);
    return (sum / sent.length) * 100;
  }, [campaigns]);

  const avgClickRate = useMemo(() => {
    const sent = campaigns.filter((c) => c.status === "sent" && c.click_rate != null);
    if (!sent.length) return 0;
    const sum = sent.reduce((acc, c) => {
      const rate = Number(c.click_rate);
      return acc + (rate > 1 ? rate / 100 : rate);
    }, 0);
    return (sum / sent.length) * 100;
  }, [campaigns]);

  /* ---------- Render ---------- */

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Email Marketing</h1>
            <p className="text-muted-foreground">
              Sprava email kampani pres Ecomail
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova kampan
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Celkem kampani"
            value={fmtNumber(totalCampaigns)}
            icon={Mail}
            description={`${campaigns.filter((c) => c.status === "sent").length} odeslanych`}
          />
          <MetricCard
            title="Prumerna mira otevreni"
            value={`${avgOpenRate.toFixed(1)} %`}
            icon={Eye}
            trend={avgOpenRate >= 20 ? "up" : avgOpenRate >= 10 ? "neutral" : "down"}
            change="open rate"
          />
          <MetricCard
            title="Prumerna mira prokliku"
            value={`${avgClickRate.toFixed(1)} %`}
            icon={MousePointerClick}
            trend={avgClickRate >= 3 ? "up" : avgClickRate >= 1 ? "neutral" : "down"}
            change="click rate"
          />
          <MetricCard
            title="Celkem odberatelu"
            value={fmtNumber(totalSubscribers)}
            icon={Users}
            description="Aktivnich odberatelu"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="campaigns">
              <Send className="h-4 w-4 mr-1" />
              Kampane
            </TabsTrigger>
            <TabsTrigger value="automations">
              <Zap className="h-4 w-4 mr-1" />
              Automatizace
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="h-4 w-4 mr-1" />
              Sablony
            </TabsTrigger>
            <TabsTrigger value="subscribers">
              <Users className="h-4 w-4 mr-1" />
              Odberatele
            </TabsTrigger>
          </TabsList>

          {/* ===== CAMPAIGNS TAB ===== */}
          <TabsContent value="campaigns" className="mt-4">
            {/* Filters */}
            <Card className="mb-4">
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Hledat kampan podle nazvu nebo predmetu..."
                      value={campaignSearch}
                      onChange={(e) => setCampaignSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v);
                      setPage(0);
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Stav" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Vsechny stavy</SelectItem>
                      <SelectItem value="draft">Koncept</SelectItem>
                      <SelectItem value="scheduled">Naplanovano</SelectItem>
                      <SelectItem value="sending">Odesila se</SelectItem>
                      <SelectItem value="sent">Odeslano</SelectItem>
                      <SelectItem value="failed">Chyba</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Kampane ({totalCampaigns})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {campaignsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredCampaigns.length === 0 ? (
                  <EmptyState
                    icon={Mail}
                    title="Zadne kampane"
                    description="Zatim nebyly vytvoreny zadne email kampane. Vytvorte prvni kampan kliknutim na tlacitko vyse."
                    action={
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova kampan
                      </Button>
                    }
                  />
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nazev</TableHead>
                          <TableHead>Predmet</TableHead>
                          <TableHead>Stav</TableHead>
                          <TableHead className="text-right">Odeslano</TableHead>
                          <TableHead className="text-right">Otevreni</TableHead>
                          <TableHead className="text-right">Prokliky</TableHead>
                          <TableHead className="text-right">Open rate</TableHead>
                          <TableHead className="text-right">Click rate</TableHead>
                          <TableHead>Datum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCampaigns.map((campaign) => (
                          <TableRow key={campaign.id}>
                            <TableCell>
                              <div className="font-medium max-w-[200px] truncate">
                                {campaign.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                                {campaign.subject || "\u2014"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`border-0 ${CAMPAIGN_STATUS_STYLES[campaign.status] || "bg-gray-100 text-gray-800"}`}
                              >
                                {CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {fmtNumber(campaign.sent_count)}
                            </TableCell>
                            <TableCell className="text-right">
                              {fmtNumber(campaign.open_count)}
                            </TableCell>
                            <TableCell className="text-right">
                              {fmtNumber(campaign.click_count)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={Number(campaign.open_rate) > 0 ? "text-green-600 font-medium" : "text-muted-foreground"}>
                                {fmtPercent(campaign.open_rate)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={Number(campaign.click_rate) > 0 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
                                {fmtPercent(campaign.click_rate)}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {campaign.sent_at
                                ? fmtDate(campaign.sent_at)
                                : campaign.scheduled_at
                                  ? `Plan: ${fmtDate(campaign.scheduled_at)}`
                                  : fmtDate(campaign.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Zobrazeno {page * PAGE_SIZE + 1}
                          {"\u2013"}
                          {Math.min((page + 1) * PAGE_SIZE, totalCampaigns)} z{" "}
                          {totalCampaigns}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 0}
                            onClick={() => setPage(page - 1)}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Predchozi
                          </Button>
                          <span className="text-sm text-muted-foreground px-2">
                            {page + 1} / {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(page + 1)}
                          >
                            Dalsi
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== AUTOMATIONS TAB ===== */}
          <TabsContent value="automations" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Automatizace ({automations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {automationsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : automations.length === 0 ? (
                  <EmptyState
                    icon={Zap}
                    title="Zadne automatizace"
                    description="Zatim nebyly nastaveny zadne automatizovane email sekvence. Nastavte automatizace v Ecomail a zobrazí se zde."
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nazev</TableHead>
                        <TableHead>Trigger</TableHead>
                        <TableHead>Stav</TableHead>
                        <TableHead className="text-right">Odeslane emaily</TableHead>
                        <TableHead>Vytvoreno</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {automations.map((automation) => (
                        <TableRow key={automation.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Zap className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-medium">{automation.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {automation.trigger || "\u2014"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`border-0 ${AUTOMATION_STATUS_STYLES[automation.status || "inactive"] || ""}`}
                            >
                              {AUTOMATION_STATUS_LABELS[automation.status || "inactive"] || automation.status || "Neaktivni"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {fmtNumber(automation.emails_sent)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {fmtDate(automation.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TEMPLATES TAB ===== */}
          <TabsContent value="templates" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Sablony ({templates.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : templates.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="Zadne sablony"
                    description="Zatim nejsou k dispozici zadne emailove sablony. Vytvorte sablony v Ecomail a zobrazí se zde."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template) => (
                      <Card key={template.id} className="border hover:shadow-md transition-shadow">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-medium truncate">{template.name}</h3>
                              {template.subject && (
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                  {template.subject}
                                </p>
                              )}
                              {template.created_at && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Vytvoreno: {fmtDate(template.created_at)}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== SUBSCRIBERS TAB ===== */}
          <TabsContent value="subscribers" className="mt-4">
            {/* Subscriber summary card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <MetricCard
                title="Celkem odberatelu"
                value={fmtNumber(totalSubscribers)}
                icon={Users}
                description="Ve vsech seznamech"
              />
              <MetricCard
                title="Poslednich 30 dni"
                value={fmtNumber(
                  subscribers.filter(
                    (s) =>
                      s.subscribed_at &&
                      s.subscribed_at > Date.now() / 1000 - 30 * 86400
                  ).length
                )}
                icon={UserPlus}
                description="Novych odberatelu"
              />
              <MetricCard
                title="Aktivnich"
                value={fmtNumber(
                  subscribers.filter(
                    (s) => !s.status || s.status === "active" || s.status === "subscribed"
                  ).length
                )}
                icon={BarChart3}
                description="Se statusem aktivni"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Posledni odberatele
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscribersLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : subscribers.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="Zadni odberatele"
                    description="Zatim nebyli nalezeni zadni odberatele. Odberatele se synchronizuji z Ecomail."
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Jmeno</TableHead>
                        <TableHead>Stav</TableHead>
                        <TableHead>Datum prihlaseni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.map((subscriber) => (
                        <TableRow key={subscriber.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Mail className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-medium">{subscriber.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {subscriber.name || "\u2014"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`border-0 ${
                                !subscriber.status || subscriber.status === "active" || subscriber.status === "subscribed"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : subscriber.status === "unsubscribed"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                              }`}
                            >
                              {subscriber.status === "unsubscribed"
                                ? "Odhlaseny"
                                : subscriber.status || "Aktivni"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {fmtDateTime(subscriber.subscribed_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
