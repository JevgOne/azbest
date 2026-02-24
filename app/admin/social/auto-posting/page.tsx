"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { MetricCard } from "@/components/admin/MetricCard";
import { EmptyState } from "@/components/admin/EmptyState";
import {
  Settings, Play, Clock, History, ListPlus, Zap,
  Instagram, Facebook, CheckCircle, XCircle, Loader2,
  Trash2, Plus, Calendar, Send, Bot, Package,
} from "lucide-react";
import { useState, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────────

interface AutoPostRules {
  newProducts?: boolean;
  onSale?: boolean;
  highStock?: boolean;
  stockThreshold?: number;
}

interface AutoPostConfig {
  id: number;
  enabled: boolean;
  rules: AutoPostRules;
  accountIds: string[];
  captionPrompt: string | null;
  postTime: string;
}

interface QueueItem {
  id: number;
  productId: number;
  productName: string;
  price: number;
  images: string[];
  category: string | null;
  priority: number;
  status: string;
  createdAt: number;
}

interface HistoryItem {
  id: number;
  productId: number;
  productName: string;
  productImages: string[];
  genviralPostId: string | null;
  caption: string;
  accountIds: string[];
  source: string;
  status: string;
  errorMessage: string | null;
  createdAt: number;
}

interface GenViralAccount {
  id: number;
  genviral_id: string;
  platform: string;
  username: string;
  display_name: string | null;
  profile_image_url: string | null;
  connected: number;
}

interface RecentPost {
  id: number;
  platform: string;
  content: string;
  status: string;
  scheduled_at: number | null;
  published_at: number | null;
  created_at: number;
  account_username: string | null;
  post_platform: string | null;
}

const PLATFORM_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
};

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  pinterest: "Pinterest",
  linkedin: "LinkedIn",
};

const SOURCE_LABELS: Record<string, string> = {
  auto: "Automaticky",
  manual_queue: "Z fronty",
  manual_trigger: "Manuální",
};

// ─── Main Page ───────────────────────────────────────────────────

export default function AutoPostingPage() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["auto-posting"],
    queryFn: async () => {
      const res = await fetch("/api/social/auto-posting");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as {
        config: AutoPostConfig | null;
        queue: QueueItem[];
        history: HistoryItem[];
        historyTotal: number;
        accounts: GenViralAccount[];
        recentPosts: RecentPost[];
      };
    },
  });

  // ─── State ───────────────────────────────────────────────────

  const [enabled, setEnabled] = useState(false);
  const [rules, setRules] = useState<AutoPostRules>({});
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [captionPrompt, setCaptionPrompt] = useState("");
  const [postTime, setPostTime] = useState("10:00");
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (data?.config) {
      setEnabled(data.config.enabled);
      setRules(data.config.rules || {});
      setSelectedAccounts(data.config.accountIds || []);
      setCaptionPrompt(data.config.captionPrompt || "");
      setPostTime(data.config.postTime || "10:00");
    }
  }, [data?.config]);

  // ─── Mutations ─────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/social/auto-posting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          rules,
          accountIds: selectedAccounts,
          captionPrompt: captionPrompt || null,
          postTime,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-posting"] });
      setHasChanges(false);
    },
  });

  const triggerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/cron/auto-posting", { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || json.data?.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-posting"] });
    },
  });

  const removeFromQueueMutation = useMutation({
    mutationFn: async (queueId: number) => {
      const res = await fetch(`/api/social/auto-posting/queue?id=${queueId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-posting"] });
    },
  });

  // ─── Helpers ───────────────────────────────────────────────

  const markChanged = () => setHasChanges(true);

  const toggleAccount = (genviralId: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(genviralId)
        ? prev.filter((id) => id !== genviralId)
        : [...prev, genviralId]
    );
    markChanged();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString("cs-CZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const lastPost = data?.history?.[0];
  const postedCount = data?.history?.filter((h) => h.status === "posted").length || 0;
  const failedCount = data?.history?.filter((h) => h.status === "failed").length || 0;
  const queueCount = data?.queue?.length || 0;

  // ─── Render ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Auto-posting</h1>
            <p className="text-muted-foreground">
              Automatické postování produktů na Instagram a Facebook
            </p>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4 mr-2" />
                )}
                Uložit nastavení
              </Button>
            )}
            <Button
              variant="default"
              onClick={() => triggerMutation.mutate()}
              disabled={triggerMutation.isPending || !data?.config || selectedAccounts.length === 0}
            >
              {triggerMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Postovat teď
            </Button>
          </div>
        </div>

        {/* Status feedback */}
        {saveMutation.isSuccess && (
          <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Nastavení uloženo
          </div>
        )}
        {triggerMutation.isSuccess && (
          <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Post úspěšně vytvořen: {triggerMutation.data?.productName}
          </div>
        )}
        {triggerMutation.isError && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            {(triggerMutation.error as Error).message}
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Status"
            value={enabled ? "Aktivní" : "Neaktivní"}
            icon={enabled ? Zap : Clock}
            description={enabled ? `Denně v ${postTime}` : "Auto-posting vypnutý"}
          />
          <MetricCard
            title="Postnuté"
            value={postedCount}
            icon={Send}
            description="Za posledních 30 dní"
          />
          <MetricCard
            title="Ve frontě"
            value={queueCount}
            icon={ListPlus}
            description="Čekající produkty"
          />
          <MetricCard
            title="Poslední post"
            value={lastPost ? formatDate(lastPost.createdAt) : "—"}
            icon={History}
            description={lastPost?.productName || "Zatím žádný"}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="settings">
          <TabsList>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Nastavení
            </TabsTrigger>
            <TabsTrigger value="accounts" className="gap-2">
              <Instagram className="h-4 w-4" />
              Účty & Plánování
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-2">
              <ListPlus className="h-4 w-4" />
              Fronta ({queueCount})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Historie
            </TabsTrigger>
          </TabsList>

          {/* ─── Settings Tab ─────────────────────────────── */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            {/* Enable/Disable */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Automatické postování</span>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(v) => {
                      setEnabled(v);
                      markChanged();
                    }}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Pokud je zapnuté, systém denně v nastavený čas automaticky vybere produkt,
                  vygeneruje AI caption a postne na vybrané účty.
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <Label htmlFor="postTime">Čas postování</Label>
                  <Input
                    id="postTime"
                    type="time"
                    value={postTime}
                    onChange={(e) => {
                      setPostTime(e.target.value);
                      markChanged();
                    }}
                    className="w-32"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Rules */}
            <Card>
              <CardHeader>
                <CardTitle>Pravidla výběru produktu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="rule-new"
                    checked={rules.newProducts || false}
                    onCheckedChange={(v) => {
                      setRules({ ...rules, newProducts: !!v });
                      markChanged();
                    }}
                  />
                  <Label htmlFor="rule-new">Nové produkty (nejnovější první)</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="rule-sale"
                    checked={rules.onSale || false}
                    onCheckedChange={(v) => {
                      setRules({ ...rules, onSale: !!v });
                      markChanged();
                    }}
                  />
                  <Label htmlFor="rule-sale">Produkty ve slevě</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="rule-stock"
                    checked={rules.highStock || false}
                    onCheckedChange={(v) => {
                      setRules({ ...rules, highStock: !!v });
                      markChanged();
                    }}
                  />
                  <Label htmlFor="rule-stock">Vysoký sklad</Label>
                </div>
                {rules.highStock && (
                  <div className="ml-7 flex items-center gap-3">
                    <Label htmlFor="stockThreshold">Min. kusů na skladě</Label>
                    <Input
                      id="stockThreshold"
                      type="number"
                      value={rules.stockThreshold || 10}
                      onChange={(e) => {
                        setRules({ ...rules, stockThreshold: parseInt(e.target.value) || 10 });
                        markChanged();
                      }}
                      className="w-24"
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Manuální fronta má vždy přednost. Produkty postnuté za posledních 30 dní jsou vyloučeny.
                </p>
              </CardContent>
            </Card>

            {/* AI Template */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI šablona (Claude)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="captionPrompt" className="text-sm text-muted-foreground mb-2 block">
                  Vlastní system prompt pro generování captionů. Nechte prázdné pro výchozí šablonu.
                </Label>
                <Textarea
                  id="captionPrompt"
                  value={captionPrompt}
                  onChange={(e) => {
                    setCaptionPrompt(e.target.value);
                    markChanged();
                  }}
                  placeholder="Jsi marketingový copywriter pro e-shop qsport.cz — autorizovaný prémiový sportovní dealer z Krkonoš..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Model: Claude Haiku 4.5 (rychlý, levný). Max 500 znaků caption.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Accounts & Planning Tab ──────────────────── */}
          <TabsContent value="accounts" className="space-y-4 mt-4">
            {/* Account Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Sociální účty pro auto-posting</CardTitle>
              </CardHeader>
              <CardContent>
                {(!data?.accounts || data.accounts.length === 0) ? (
                  <EmptyState
                    title="Žádné propojené účty"
                    description="Propojte IG/FB účty přes GenViral v Social Planner."
                    action={
                      <Button variant="outline" onClick={() => window.location.href = "/admin/social/planner"}>
                        Přejít na Social Planner
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {data.accounts.map((account) => {
                      const Icon = PLATFORM_ICONS[account.platform] || Send;
                      const isSelected = selectedAccounts.includes(account.genviral_id);
                      return (
                        <div
                          key={account.genviral_id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                          }`}
                          onClick={() => toggleAccount(account.genviral_id)}
                        >
                          <Checkbox checked={isSelected} />
                          {account.profile_image_url ? (
                            <img
                              src={account.profile_image_url}
                              alt=""
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <Icon className="h-4 w-4" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {account.display_name || account.username}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              @{account.username}
                            </div>
                          </div>
                          <Badge variant="outline">
                            {PLATFORM_LABELS[account.platform] || account.platform}
                          </Badge>
                        </div>
                      );
                    })}
                    <p className="text-xs text-muted-foreground mt-2">
                      Vyberte účty, na které bude auto-posting publikovat. Meta (IG/FB) účty jsou
                      propojené přes GenViral API.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Planning Calendar — Real data from scheduled/published posts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Plánování příspěvků
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(!data?.recentPosts || data.recentPosts.length === 0) ? (
                  <p className="text-sm text-muted-foreground">Zatím žádné naplánované ani publikované příspěvky.</p>
                ) : (
                  <div className="space-y-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Datum</TableHead>
                          <TableHead>Platforma</TableHead>
                          <TableHead>Účet</TableHead>
                          <TableHead>Obsah</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.recentPosts.map((post) => (
                          <TableRow key={`${post.id}-${post.account_username}`}>
                            <TableCell className="text-xs whitespace-nowrap">
                              {formatDate(post.scheduled_at || post.published_at || post.created_at)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {PLATFORM_LABELS[post.post_platform || post.platform] || post.platform}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {post.account_username ? `@${post.account_username}` : "—"}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm">
                              {post.content}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={post.status === "published" ? "default" : "secondary"}
                              >
                                {post.status === "published" ? "Publikováno" :
                                 post.status === "scheduled" ? "Naplánováno" :
                                 post.status === "failed" ? "Chyba" : post.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <p className="text-xs text-muted-foreground">
                      Reálná data z GenViral API — posledních 30 příspěvků naplánovaných a publikovaných přes Meta (IG/FB) a další platformy.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Queue Tab ────────────────────────────────── */}
          <TabsContent value="queue" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Manuální fronta</span>
                  <Button size="sm" onClick={() => setShowProductPicker(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Přidat produkt
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(!data?.queue || data.queue.length === 0) ? (
                  <EmptyState
                    icon={Package}
                    title="Fronta je prázdná"
                    description="Přidejte produkty do fronty a budou postnuty přednostně při příštím auto-postu."
                    action={
                      <Button variant="outline" size="sm" onClick={() => setShowProductPicker(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Přidat produkt
                      </Button>
                    }
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produkt</TableHead>
                        <TableHead>Kategorie</TableHead>
                        <TableHead>Cena</TableHead>
                        <TableHead>Priorita</TableHead>
                        <TableHead>Přidáno</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.queue.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.images[0] && (
                                <img src={item.images[0]} alt="" className="h-8 w-8 rounded object-cover" />
                              )}
                              <span className="text-sm font-medium">{item.productName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.category || "—"}
                          </TableCell>
                          <TableCell className="text-sm">{item.price} Kč</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.priority}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromQueueMutation.mutate(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── History Tab ──────────────────────────────── */}
          <TabsContent value="history" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Historie auto-postingu</CardTitle>
              </CardHeader>
              <CardContent>
                {(!data?.history || data.history.length === 0) ? (
                  <EmptyState
                    icon={History}
                    title="Zatím žádný auto-post"
                    description="Spusťte auto-posting nebo přidejte produkty do fronty."
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produkt</TableHead>
                        <TableHead>Caption</TableHead>
                        <TableHead>Zdroj</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Datum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.history.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.productImages?.[0] && (
                                <img src={item.productImages[0]} alt="" className="h-8 w-8 rounded object-cover" />
                              )}
                              <span className="text-sm font-medium max-w-[150px] truncate block">
                                {item.productName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[250px]">
                            <p className="text-sm truncate">{item.caption}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {SOURCE_LABELS[item.source] || item.source}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={item.status === "posted" ? "default" : "destructive"}
                            >
                              {item.status === "posted" ? "Postnuté" : "Chyba"}
                            </Badge>
                            {item.errorMessage && (
                              <p className="text-xs text-red-500 mt-1">{item.errorMessage}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(item.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {data?.historyTotal && data.historyTotal > 20 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Zobrazeno 20 z {data.historyTotal} záznamů
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ─── Product Picker Dialog ──────────────────────── */}
        {showProductPicker && (
          <ProductPickerDialog
            onClose={() => setShowProductPicker(false)}
            onAdd={() => {
              setShowProductPicker(false);
              queryClient.invalidateQueries({ queryKey: ["auto-posting"] });
            }}
          />
        )}
      </main>
    </div>
  );
}

// ─── Product Picker Dialog ───────────────────────────────────────

function ProductPickerDialog({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products-search", search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/shoptet/products?${params}`);
      const json = await res.json();
      return json.data?.products || [];
    },
    enabled: true,
  });

  const addProduct = async (productId: number) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/social/auto-posting/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, priority: 0 }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onAdd();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Přidat produkt do fronty</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Hledat produkt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : !products?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Žádné produkty
              </p>
            ) : (
              products.map((product: any) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-2 rounded-lg border hover:bg-accent cursor-pointer"
                  onClick={() => !submitting && addProduct(product.id)}
                >
                  {product.images?.[0] && (
                    <img
                      src={typeof product.images === 'string' ? JSON.parse(product.images)?.[0] : product.images[0]}
                      alt=""
                      className="h-10 w-10 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.price} Kč
                      {product.category ? ` · ${product.category}` : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" disabled={submitting}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
