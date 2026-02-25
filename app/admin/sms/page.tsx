"use client";

import { useState, useMemo } from "react";
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricCard } from "@/components/admin/MetricCard";
import {
  MessageSquare,
  Send,
  Users,
  Loader2,
  Plus,
  CheckCircle,
  XCircle,
  DollarSign,
  BarChart3,
  Phone,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SmsCampaign {
  id: number;
  name: string;
  message: string;
  sender: string | null;
  recipients: string | null;
  segment: string | null;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  status: string;
  scheduled_at: number | null;
  sent_at: number | null;
  cost: number | null;
  created_at: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 25;
const SMS_MAX_LENGTH = 160;

const SMS_STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  sending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  sent: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const SMS_STATUS_LABELS: Record<string, string> = {
  draft: "Koncept",
  scheduled: "Naplanovano",
  sending: "Odesila se",
  sent: "Odeslano",
  failed: "Chyba",
};

const SEGMENT_OPTIONS = [
  { value: "all", label: "Vsichni zakaznici" },
  { value: "active", label: "Aktivni zakaznici" },
  { value: "vip", label: "VIP zakaznici" },
  { value: "inactive", label: "Neaktivni zakaznici" },
  { value: "new", label: "Novi zakaznici" },
  { value: "custom", label: "Vlastni cisla" },
];

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

function fmtNumber(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("cs-CZ");
}

function fmtCurrency(value: number | null | undefined): string {
  if (value == null) return "0 Kc";
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 2,
  }).format(value);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

function parseRecipients(recipients: string | null): string[] {
  if (!recipients) return [];
  try {
    const parsed = JSON.parse(recipients);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return recipients
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SMSCampaignsPage() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  /* ---------- Campaigns query ---------- */

  const campaignParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(page * PAGE_SIZE));
    return params.toString();
  }, [page]);

  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ["sms-campaigns", campaignParams],
    queryFn: async () => {
      const res = await fetch(`/api/sms/campaigns?${campaignParams}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { campaigns: SmsCampaign[]; total: number };
    },
  });

  /* ---------- Send mutation ---------- */

  const sendMutation = useMutation({
    mutationFn: async (payload: { to: string; message: string; campaignId?: number }) => {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-campaigns"] });
    },
  });

  /* ---------- Derived data ---------- */

  const allCampaigns = campaignsData?.campaigns || [];
  const totalCampaigns = campaignsData?.total || 0;
  const totalPages = Math.ceil(totalCampaigns / PAGE_SIZE);

  const filteredCampaigns = useMemo(() => {
    if (statusFilter === "all") return allCampaigns;
    return allCampaigns.filter((c) => c.status === statusFilter);
  }, [allCampaigns, statusFilter]);

  /* ---------- KPI metrics ---------- */

  const stats = useMemo(() => {
    const totalDelivered = allCampaigns.reduce(
      (acc, c) => acc + (Number(c.delivered_count) || 0),
      0
    );
    const totalSent = allCampaigns.reduce(
      (acc, c) => acc + (Number(c.sent_count) || 0),
      0
    );
    const deliveredRate =
      totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const totalCost = allCampaigns.reduce(
      (acc, c) => acc + (Number(c.cost) || 0),
      0
    );
    const totalRecipients = allCampaigns.reduce((acc, c) => {
      const r = parseRecipients(c.recipients);
      return acc + r.length;
    }, 0);

    return {
      totalCampaigns: totalCampaigns,
      deliveredRate,
      totalCost,
      totalRecipients,
      totalSent,
      totalDelivered,
    };
  }, [allCampaigns, totalCampaigns]);

  /* ---------- Render ---------- */

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">SMS Kampane</h1>
            <p className="text-muted-foreground">
              Sprava SMS kampani pres GoSMS.cz
            </p>
          </div>
          <Button onClick={() => setShowSendDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova SMS kampan
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Celkem kampani"
            value={fmtNumber(stats.totalCampaigns)}
            icon={MessageSquare}
            description={`${allCampaigns.filter((c) => c.status === "sent").length} odeslanych`}
          />
          <MetricCard
            title="Mira doruceni"
            value={`${stats.deliveredRate.toFixed(1)} %`}
            icon={BarChart3}
            trend={
              stats.deliveredRate >= 95
                ? "up"
                : stats.deliveredRate >= 80
                  ? "neutral"
                  : "down"
            }
            change={`${fmtNumber(stats.totalDelivered)} z ${fmtNumber(stats.totalSent)}`}
          />
          <MetricCard
            title="Celkove naklady"
            value={fmtCurrency(stats.totalCost)}
            icon={DollarSign}
            description="Za vsechny kampane"
          />
          <MetricCard
            title="Celkem prijemcu"
            value={fmtNumber(stats.totalRecipients)}
            icon={Users}
            description="Unikatnich cisel"
          />
        </div>

        {/* Quick send form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Rychle odeslani SMS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuickSmsForm
              onSend={(payload) => sendMutation.mutate(payload)}
              isPending={sendMutation.isPending}
              isSuccess={sendMutation.isSuccess}
              error={sendMutation.error?.message}
            />
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-3">
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

        {/* Campaigns Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              SMS Kampane ({totalCampaigns})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Zadne SMS kampane"
                description="Zatim nebyly vytvoreny zadne SMS kampane. Vytvorte prvni kampan kliknutim na tlacitko vyse."
                action={
                  <Button onClick={() => setShowSendDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova SMS kampan
                  </Button>
                }
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nazev</TableHead>
                      <TableHead>Zprava</TableHead>
                      <TableHead>Odesilatel</TableHead>
                      <TableHead className="text-right">Odeslano</TableHead>
                      <TableHead className="text-right">Doruceno</TableHead>
                      <TableHead className="text-right">Chyby</TableHead>
                      <TableHead>Stav</TableHead>
                      <TableHead className="text-right">Naklady</TableHead>
                      <TableHead>Datum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map((campaign) => {
                      const deliveryRate =
                        Number(campaign.sent_count) > 0
                          ? (
                              (Number(campaign.delivered_count) /
                                Number(campaign.sent_count)) *
                              100
                            ).toFixed(0)
                          : "\u2014";
                      return (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <MessageSquare className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-medium max-w-[150px] truncate">
                                {campaign.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
                              {truncateText(campaign.message, 50)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {campaign.sender || "\u2014"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {fmtNumber(campaign.sent_count)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <span className="font-medium">
                                {fmtNumber(campaign.delivered_count)}
                              </span>
                              {deliveryRate !== "\u2014" && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({deliveryRate} %)
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(campaign.failed_count) > 0 ? (
                              <span className="text-red-600 font-medium">
                                {fmtNumber(campaign.failed_count)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`border-0 ${SMS_STATUS_STYLES[campaign.status] || "bg-gray-100 text-gray-800"}`}
                            >
                              {SMS_STATUS_LABELS[campaign.status] ||
                                campaign.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {campaign.cost != null
                              ? fmtCurrency(campaign.cost)
                              : "\u2014"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {campaign.sent_at
                              ? fmtDate(campaign.sent_at)
                              : campaign.scheduled_at
                                ? `Plan: ${fmtDate(campaign.scheduled_at)}`
                                : fmtDate(campaign.created_at)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

        {/* Send SMS Dialog */}
        {showSendDialog && (
          <SendSmsDialog
            onClose={() => {
              setShowSendDialog(false);
              sendMutation.reset();
            }}
            onSend={(payload) => sendMutation.mutate(payload)}
            isPending={sendMutation.isPending}
            isSuccess={sendMutation.isSuccess}
            error={sendMutation.error?.message}
          />
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick SMS Form                                                     */
/* ------------------------------------------------------------------ */

function QuickSmsForm({
  onSend,
  isPending,
  isSuccess,
  error,
}: {
  onSend: (payload: { to: string; message: string }) => void;
  isPending: boolean;
  isSuccess: boolean;
  error?: string;
}) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const charCount = message.length;
  const smsCount = Math.ceil(charCount / SMS_MAX_LENGTH) || 1;
  const charsRemaining = SMS_MAX_LENGTH - (charCount % SMS_MAX_LENGTH || SMS_MAX_LENGTH);

  const handleSubmit = () => {
    if (!phone.trim() || !message.trim()) return;
    onSend({ to: phone.trim(), message: message.trim() });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="quick-phone">
            <Phone className="h-3 w-3 inline mr-1" />
            Telefonni cislo *
          </Label>
          <Input
            id="quick-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+420 123 456 789"
          />
        </div>
        <div>
          <Label htmlFor="quick-message">
            <MessageSquare className="h-3 w-3 inline mr-1" />
            Zprava *
          </Label>
          <Textarea
            id="quick-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Text SMS zpravy..."
            rows={3}
            maxLength={SMS_MAX_LENGTH * 3}
          />
          <div className="flex justify-between mt-1">
            <p
              className={`text-xs ${
                charCount > SMS_MAX_LENGTH
                  ? "text-orange-600"
                  : "text-muted-foreground"
              }`}
            >
              {charCount}/{SMS_MAX_LENGTH} znaku
              {smsCount > 1 && ` (${smsCount} SMS)`}
            </p>
            {charCount > 0 && charCount <= SMS_MAX_LENGTH && (
              <p className="text-xs text-muted-foreground">
                Zbyva {charsRemaining} znaku
              </p>
            )}
          </div>
          {charCount > SMS_MAX_LENGTH && (
            <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
              <AlertCircle className="h-3 w-3" />
              Zprava presahuje 160 znaku a bude odeslana jako {smsCount} SMS
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col justify-end space-y-4">
        <Button
          onClick={handleSubmit}
          disabled={isPending || !phone.trim() || !message.trim()}
          className="w-full"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Odeslat SMS
        </Button>
        {isSuccess && (
          <div className="p-2 bg-green-50 dark:bg-green-950 rounded-md text-sm">
            <div className="flex items-center gap-1 text-green-700 dark:text-green-300">
              <CheckCircle className="h-4 w-4" />
              SMS byla uspesne odeslana
            </div>
          </div>
        )}
        {error && (
          <div className="p-2 bg-red-50 dark:bg-red-950 rounded-md text-sm">
            <div className="flex items-center gap-1 text-red-700 dark:text-red-300">
              <XCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Send SMS Dialog                                                    */
/* ------------------------------------------------------------------ */

function SendSmsDialog({
  onClose,
  onSend,
  isPending,
  isSuccess,
  error,
}: {
  onClose: () => void;
  onSend: (payload: { to: string; message: string }) => void;
  isPending: boolean;
  isSuccess: boolean;
  error?: string;
}) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sender, setSender] = useState("");
  const [segment, setSegment] = useState("all");
  const [customRecipients, setCustomRecipients] = useState("");

  const charCount = message.length;
  const smsCount = Math.ceil(charCount / SMS_MAX_LENGTH) || 1;
  const charsRemaining = SMS_MAX_LENGTH - (charCount % SMS_MAX_LENGTH || SMS_MAX_LENGTH);

  const handleSubmit = () => {
    if (!message.trim()) return;
    const recipientNumber =
      segment === "custom" ? customRecipients.trim() : segment;
    onSend({
      to: recipientNumber,
      message: message.trim(),
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova SMS kampan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {isSuccess && (
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md text-sm">
              <div className="flex items-center gap-1 text-green-700 dark:text-green-300">
                <CheckCircle className="h-4 w-4" />
                SMS kampan byla uspesne odeslana.
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="sms-name">Nazev kampane</Label>
            <Input
              id="sms-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nazev kampane..."
            />
          </div>
          <div>
            <Label htmlFor="sms-message">Zprava *</Label>
            <Textarea
              id="sms-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Text SMS zpravy..."
              rows={4}
              maxLength={SMS_MAX_LENGTH * 3}
            />
            <div className="flex justify-between mt-1">
              <p
                className={`text-xs ${
                  charCount > SMS_MAX_LENGTH
                    ? "text-orange-600 font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {charCount}/{SMS_MAX_LENGTH} znaku
                {smsCount > 1 && ` (${smsCount} SMS)`}
              </p>
              {charCount > 0 && charCount <= SMS_MAX_LENGTH && (
                <p className="text-xs text-muted-foreground">
                  Zbyva {charsRemaining} znaku
                </p>
              )}
            </div>
            {charCount > SMS_MAX_LENGTH && (
              <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                <AlertCircle className="h-3 w-3" />
                Zprava presahuje 160 znaku a bude odeslana jako {smsCount} SMS
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="sms-sender">Odesilatel (volitelne)</Label>
            <Input
              id="sms-sender"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="Nazev odesilatele nebo cislo..."
            />
          </div>
          <div>
            <Label htmlFor="sms-segment">Prijemci</Label>
            <Select value={segment} onValueChange={setSegment}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte segment" />
              </SelectTrigger>
              <SelectContent>
                {SEGMENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {segment === "custom" && (
            <div>
              <Label htmlFor="sms-recipients">Telefonni cisla</Label>
              <Textarea
                id="sms-recipients"
                value={customRecipients}
                onChange={(e) => setCustomRecipients(e.target.value)}
                placeholder="Zadejte cisla oddelena carkou nebo novym radkem...&#10;+420123456789&#10;+420987654321"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {customRecipients
                  .split(/[,\n]/)
                  .map((s) => s.trim())
                  .filter(Boolean).length}{" "}
                cisel
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Zrusit
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !message.trim()}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Odeslat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
