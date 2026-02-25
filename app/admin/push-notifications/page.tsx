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
  Bell,
  Send,
  Users,
  MousePointerClick,
  BarChart3,
  Loader2,
  Plus,
  ExternalLink,
  Image,
  Link as LinkIcon,
  Type,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PushSubscription {
  id: number;
  endpoint: string;
  user_agent: string | null;
  active: number;
  created_at: number;
}

interface PushCampaign {
  id: number;
  title: string;
  body: string;
  url: string | null;
  icon: string | null;
  image: string | null;
  segment: string | null;
  sent_count: number;
  click_count: number;
  status: string;
  scheduled_at: number | null;
  sent_at: number | null;
  created_at: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PUSH_STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  sent: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const PUSH_STATUS_LABELS: Record<string, string> = {
  draft: "Koncept",
  scheduled: "Naplanovano",
  sent: "Odeslano",
  failed: "Chyba",
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

function fmtNumber(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("cs-CZ");
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PushNotificationsPage() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();
  const [showSendDialog, setShowSendDialog] = useState(false);

  /* ---------- Subscriptions query ---------- */

  const { data: subscriptionsData, isLoading: subsLoading } = useQuery({
    queryKey: ["push-subscriptions"],
    queryFn: async () => {
      const res = await fetch("/api/push/subscriptions");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as {
        subscriptions: PushSubscription[];
        activeCount: number;
      };
    },
  });

  /* ---------- Push campaigns query (from push_campaigns table via subscriptions endpoint) ---------- */

  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ["push-campaigns"],
    queryFn: async () => {
      // Push campaigns are stored locally; we fetch from subscriptions
      // and derive campaign history from the push_campaigns table
      // For now we use the subscriptions endpoint which also gives us history
      try {
        const res = await fetch("/api/push/subscriptions");
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return (json.data?.campaigns || []) as PushCampaign[];
      } catch {
        return [] as PushCampaign[];
      }
    },
  });

  /* ---------- Derived data ---------- */

  const subscriptions = subscriptionsData?.subscriptions || [];
  const activeSubscribers = subscriptionsData?.activeCount || 0;
  const campaigns = campaignsData || [];

  /* ---------- KPI metrics ---------- */

  const stats = useMemo(() => {
    const totalSent = campaigns.filter((c) => c.status === "sent").length;
    const totalClicks = campaigns.reduce(
      (acc, c) => acc + (Number(c.click_count) || 0),
      0
    );
    const totalSentCount = campaigns.reduce(
      (acc, c) => acc + (Number(c.sent_count) || 0),
      0
    );
    const avgCtr =
      totalSentCount > 0 ? (totalClicks / totalSentCount) * 100 : 0;

    return { totalSent, totalClicks, totalSentCount, avgCtr };
  }, [campaigns]);

  /* ---------- Send mutation ---------- */

  const sendMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      body: string;
      url?: string;
      icon?: string;
    }) => {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["push-campaigns"] });
      setShowSendDialog(false);
    },
  });

  /* ---------- Render ---------- */

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Push Notifikace</h1>
            <p className="text-muted-foreground">
              Sprava web push notifikaci pro zakazniky
            </p>
          </div>
          <Button onClick={() => setShowSendDialog(true)}>
            <Send className="h-4 w-4 mr-2" />
            Nova notifikace
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Aktivnich odberatelu"
            value={fmtNumber(activeSubscribers)}
            icon={Users}
            description={`${fmtNumber(subscriptions.length)} celkem registrovanych`}
          />
          <MetricCard
            title="Odeslanych kampani"
            value={fmtNumber(stats.totalSent)}
            icon={Bell}
            description="Celkem odeslanych push kampani"
          />
          <MetricCard
            title="Celkem prokliku"
            value={fmtNumber(stats.totalClicks)}
            icon={MousePointerClick}
            description="Ze vsech kampani"
          />
          <MetricCard
            title="Prumerne CTR"
            value={`${stats.avgCtr.toFixed(1)} %`}
            icon={BarChart3}
            trend={stats.avgCtr >= 5 ? "up" : stats.avgCtr >= 2 ? "neutral" : "down"}
            change="click-through rate"
          />
        </div>

        {/* Quick send form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Rychle odeslani
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuickSendForm
              onSend={(payload) => sendMutation.mutate(payload)}
              isPending={sendMutation.isPending}
              isSuccess={sendMutation.isSuccess}
              result={sendMutation.data}
              error={sendMutation.error?.message}
              subscriberCount={activeSubscribers}
            />
          </CardContent>
        </Card>

        {/* Campaign history table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Historie kampani ({campaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaignsLoading || subsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="Zadne kampane"
                description="Zatim nebyly odeslany zadne push notifikace. Odeslte prvni notifikaci pomoci formulare vyse."
                action={
                  <Button onClick={() => setShowSendDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Odeslat notifikaci
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titulek</TableHead>
                    <TableHead>Text</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="text-right">Odeslano</TableHead>
                    <TableHead className="text-right">Prokliky</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead>Datum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => {
                    const ctr =
                      Number(campaign.sent_count) > 0
                        ? (
                            (Number(campaign.click_count) /
                              Number(campaign.sent_count)) *
                            100
                          ).toFixed(1)
                        : "0";
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Bell className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium max-w-[180px] truncate">
                              {campaign.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
                            {truncateText(campaign.body, 60)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {campaign.url ? (
                            <a
                              href={campaign.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Odkaz
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {"\u2014"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {fmtNumber(campaign.sent_count)}
                        </TableCell>
                        <TableCell className="text-right">
                          {fmtNumber(campaign.click_count)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              Number(ctr) >= 5
                                ? "text-green-600 font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {ctr} %
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`border-0 ${PUSH_STATUS_STYLES[campaign.status] || "bg-gray-100 text-gray-800"}`}
                          >
                            {PUSH_STATUS_LABELS[campaign.status] ||
                              campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {campaign.sent_at
                            ? fmtDate(campaign.sent_at)
                            : fmtDate(campaign.created_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Send Dialog */}
        {showSendDialog && (
          <SendPushDialog
            onClose={() => {
              setShowSendDialog(false);
              sendMutation.reset();
            }}
            onSend={(payload) => sendMutation.mutate(payload)}
            isPending={sendMutation.isPending}
            isSuccess={sendMutation.isSuccess}
            result={sendMutation.data}
            error={sendMutation.error?.message}
            subscriberCount={activeSubscribers}
          />
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick Send Form                                                    */
/* ------------------------------------------------------------------ */

function QuickSendForm({
  onSend,
  isPending,
  isSuccess,
  result,
  error,
  subscriberCount,
}: {
  onSend: (payload: { title: string; body: string; url?: string; icon?: string }) => void;
  isPending: boolean;
  isSuccess: boolean;
  result?: { sent: number; failed: number; total: number };
  error?: string;
  subscriberCount: number;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("");

  const handleSubmit = () => {
    if (!title.trim() || !body.trim()) return;
    onSend({
      title: title.trim(),
      body: body.trim(),
      url: url.trim() || undefined,
      icon: icon.trim() || undefined,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="quick-title">
            <Type className="h-3 w-3 inline mr-1" />
            Titulek *
          </Label>
          <Input
            id="quick-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titulek notifikace..."
            maxLength={100}
          />
        </div>
        <div>
          <Label htmlFor="quick-body">
            <FileText className="h-3 w-3 inline mr-1" />
            Text *
          </Label>
          <Textarea
            id="quick-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Text notifikace..."
            rows={3}
            maxLength={255}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {body.length}/255 znaku
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="quick-url">
            <LinkIcon className="h-3 w-3 inline mr-1" />
            Odkaz (volitelne)
          </Label>
          <Input
            id="quick-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div>
          <Label htmlFor="quick-icon">
            <Image className="h-3 w-3 inline mr-1" />
            Ikona URL (volitelne)
          </Label>
          <Input
            id="quick-icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="https://example.com/icon.png"
          />
        </div>
        <div className="pt-2">
          <Button
            onClick={handleSubmit}
            disabled={isPending || !title.trim() || !body.trim()}
            className="w-full"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Odeslat ({subscriberCount} odberatelu)
          </Button>
          {isSuccess && result && (
            <div className="mt-2 p-2 bg-green-50 dark:bg-green-950 rounded-md text-sm">
              <div className="flex items-center gap-1 text-green-700 dark:text-green-300">
                <CheckCircle className="h-4 w-4" />
                Odeslano: {result.sent}, Chyby: {result.failed}, Celkem: {result.total}
              </div>
            </div>
          )}
          {error && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded-md text-sm">
              <div className="flex items-center gap-1 text-red-700 dark:text-red-300">
                <XCircle className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Send Push Dialog                                                   */
/* ------------------------------------------------------------------ */

function SendPushDialog({
  onClose,
  onSend,
  isPending,
  isSuccess,
  result,
  error,
  subscriberCount,
}: {
  onClose: () => void;
  onSend: (payload: { title: string; body: string; url?: string; icon?: string }) => void;
  isPending: boolean;
  isSuccess: boolean;
  result?: { sent: number; failed: number; total: number };
  error?: string;
  subscriberCount: number;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("");

  const handleSubmit = () => {
    if (!title.trim() || !body.trim()) return;
    onSend({
      title: title.trim(),
      body: body.trim(),
      url: url.trim() || undefined,
      icon: icon.trim() || undefined,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova push notifikace</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {isSuccess && result && (
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md text-sm">
              <div className="flex items-center gap-1 text-green-700 dark:text-green-300">
                <CheckCircle className="h-4 w-4" />
                Uspesne odeslano {result.sent} z {result.total} notifikaci.
                {result.failed > 0 && ` Chyby: ${result.failed}.`}
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="push-title">Titulek *</Label>
            <Input
              id="push-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titulek notifikace..."
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor="push-body">Text *</Label>
            <Textarea
              id="push-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Text notifikace..."
              rows={3}
              maxLength={255}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {body.length}/255 znaku
            </p>
          </div>
          <div>
            <Label htmlFor="push-url">Odkaz (volitelne)</Label>
            <Input
              id="push-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://qsport.cz/akce/..."
            />
          </div>
          <div>
            <Label htmlFor="push-icon">Ikona URL (volitelne)</Label>
            <Input
              id="push-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="https://qsport.cz/icon.png"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Bude odeslano {subscriberCount} odberatelum
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Zrusit
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending || !title.trim() || !body.trim()}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
