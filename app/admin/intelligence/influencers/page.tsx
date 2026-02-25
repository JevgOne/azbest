"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricCard } from "@/components/admin/MetricCard";
import {
  Users, Plus, Trash2, Loader2, Pencil, CheckCircle, ExternalLink,
  Instagram, Youtube, Facebook, Globe, ChevronDown, ChevronUp,
  DollarSign, TrendingUp, Heart, BarChart3, Filter, UserCheck,
} from "lucide-react";
import { useState, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Influencer {
  id: number;
  name: string;
  handle: string | null;
  platform: string;
  followers: number | null;
  engagement_rate: number | null;
  sport: string | null;
  category?: string | null;
  email: string | null;
  contact_email?: string | null;
  phone: string | null;
  notes: string | null;
  status: string;
  cost_per_post: number | null;
  total_spent: number | null;
  created_at: number;
  updated_at: number;
}

interface InfluencerPost {
  id: number;
  influencer_id: number;
  platform: string;
  post_url: string | null;
  content: string | null;
  post_type: string | null;
  likes: number | null;
  comments: number | null;
  reach: number | null;
  clicks: number | null;
  conversions: number | null;
  revenue: number | null;
  cost: number | null;
  posted_at: number | null;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PLATFORMS: { value: string; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "blog", label: "Blog" },
];

const PLATFORM_LABELS: Record<string, string> = Object.fromEntries(PLATFORMS.map(p => [p.value, p.label]));

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  prospect: { label: "Prospect", color: "bg-gray-100 text-gray-800" },
  contacted: { label: "Kontaktován", color: "bg-blue-100 text-blue-800" },
  active: { label: "Aktivní", color: "bg-green-100 text-green-800" },
  inactive: { label: "Neaktivní", color: "bg-red-100 text-red-800" },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtNum(v: number | null): string {
  if (v == null) return "\u2014";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString("cs-CZ");
}

function fmtCurrency(v: number | null): string {
  if (v == null) return "\u2014";
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(v);
}

function fmtPct(v: number | null): string {
  if (v == null) return "\u2014";
  return `${v.toFixed(2)} %`;
}

function fmtDate(ts: number | null): string {
  if (!ts) return "\u2014";
  return new Date(ts * 1000).toLocaleDateString("cs-CZ", { day: "numeric", month: "short", year: "numeric" });
}

function platformIcon(p: string) {
  switch (p) {
    case "instagram": return <Instagram className="h-4 w-4 text-pink-500" />;
    case "youtube": return <Youtube className="h-4 w-4 text-red-500" />;
    case "facebook": return <Facebook className="h-4 w-4 text-blue-600" />;
    default: return <Globe className="h-4 w-4 text-muted-foreground" />;
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function InfluencersPage() {
  const { user } = useAdminAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Influencer | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  /* ---------- queries ---------- */

  const { data: influencers, isLoading } = useQuery({
    queryKey: ["intel-influencers"],
    queryFn: async () => {
      const r = await fetch("/api/intelligence/influencers");
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      return j.data as Influencer[];
    },
  });

  const { data: posts } = useQuery({
    queryKey: ["intel-influencer-posts", expandedId],
    queryFn: async () => {
      if (!expandedId) return [];
      const r = await fetch(`/api/intelligence/influencers?action=posts&influencer_id=${expandedId}`);
      const j = await r.json();
      return (j.success ? j.data : []) as InfluencerPost[];
    },
    enabled: !!expandedId,
  });

  /* ---------- mutations ---------- */

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch("/api/intelligence/influencers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intel-influencers"] }),
  });

  /* ---------- derived ---------- */

  const filtered = useMemo(() => {
    if (!influencers) return [];
    return influencers.filter(inf => {
      if (filterPlatform !== "all" && inf.platform !== filterPlatform) return false;
      if (filterStatus !== "all" && inf.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!inf.name.toLowerCase().includes(q) && !(inf.handle?.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [influencers, filterPlatform, filterStatus, search]);

  const stats = useMemo(() => {
    const total = influencers?.length || 0;
    const active = influencers?.filter(i => i.status === "active").length || 0;
    const totalSpent = influencers?.reduce((s, i) => s + (i.total_spent || 0), 0) || 0;
    const totalRevenue = posts?.reduce((s, p) => s + (p.revenue || 0), 0) || 0;
    const avgRoi = totalSpent > 0 ? ((totalRevenue / totalSpent) * 100) : 0;
    return { total, active, totalSpent, avgRoi };
  }, [influencers, posts]);

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Influenceři</h1>
            <p className="text-muted-foreground">Správa spolupráce s influencery a QSPORT TEAM</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Přidat influencera
          </Button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard title="Celkem influencerů" value={stats.total} icon={Users} description="Ve všech platformách" />
          <MetricCard title="Aktivní spolupráce" value={stats.active} icon={UserCheck} description="Právě spolupracujeme" trend={stats.active > 0 ? "up" : "neutral"} />
          <MetricCard title="Celkem investováno" value={fmtCurrency(stats.totalSpent)} icon={DollarSign} description="Celkové náklady" />
          <MetricCard title="Průměrné ROI" value={`${stats.avgRoi.toFixed(0)} %`} icon={TrendingUp} description="Návratnost investice" trend={stats.avgRoi > 100 ? "up" : stats.avgRoi > 0 ? "neutral" : "down"} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Hledat influencera..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Platforma" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny platformy</SelectItem>
              {PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Stav" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny stavy</SelectItem>
              {Object.entries(STATUS_CFG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center gap-2 py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /><span>Načítání...</span></div>
        ) : !filtered.length ? (
          <EmptyState icon={Users} title="Žádní influenceři" description="Přidejte influencery pro sledování spolupráce a výkonu kampaní."
            action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />Přidat influencera</Button>} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Influenceři ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Jméno</TableHead>
                    <TableHead>Platforma</TableHead>
                    <TableHead className="text-right">Sledující</TableHead>
                    <TableHead className="text-right">Engagement</TableHead>
                    <TableHead className="text-right">Cena/příspěvek</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead className="text-right">Investováno</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(inf => {
                    const stCfg = STATUS_CFG[inf.status] || STATUS_CFG.prospect;
                    const isExpanded = expandedId === inf.id;
                    return (
                      <>
                        <TableRow key={inf.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setExpandedId(isExpanded ? null : inf.id)}>
                          <TableCell className="w-8">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                {platformIcon(inf.platform)}
                              </div>
                              <div>
                                <div>{inf.name}</div>
                                {inf.handle && <div className="text-xs text-muted-foreground">@{inf.handle}</div>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {platformIcon(inf.platform)}
                              <span className="text-sm">{PLATFORM_LABELS[inf.platform] || inf.platform}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{fmtNum(inf.followers)}</TableCell>
                          <TableCell className="text-right">{fmtPct(inf.engagement_rate)}</TableCell>
                          <TableCell className="text-right">{fmtCurrency(inf.cost_per_post)}</TableCell>
                          <TableCell><Badge variant="outline" className={stCfg.color}>{stCfg.label}</Badge></TableCell>
                          <TableCell className="text-right font-medium">{fmtCurrency(inf.total_spent)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" onClick={() => setEditItem(inf)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => { if (confirm(`Opravdu smazat ${inf.name}?`)) deleteMut.mutate(inf.id); }}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {/* Expanded posts sub-table */}
                        {isExpanded && (
                          <TableRow key={`${inf.id}-posts`}>
                            <TableCell colSpan={9} className="bg-muted/30 p-4">
                              <PostsSubTable influencerId={inf.id} posts={posts || []} />
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        {showCreate && (
          <InfluencerDialog onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ["intel-influencers"] }); }} />
        )}
        {editItem && (
          <InfluencerDialog influencer={editItem} onClose={() => setEditItem(null)} onSuccess={() => { setEditItem(null); qc.invalidateQueries({ queryKey: ["intel-influencers"] }); }} />
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Posts Sub-table                                                    */
/* ------------------------------------------------------------------ */

function PostsSubTable({ influencerId, posts }: { influencerId: number; posts: InfluencerPost[] }) {
  const filtered = posts.filter(p => p.influencer_id === influencerId);

  if (!filtered.length) {
    return <p className="text-sm text-muted-foreground py-2">Zatím žádné zaznamenané příspěvky.</p>;
  }

  const totalRevenue = filtered.reduce((s, p) => s + (p.revenue || 0), 0);
  const totalCost = filtered.reduce((s, p) => s + (p.cost || 0), 0);
  const totalReach = filtered.reduce((s, p) => s + (p.reach || 0), 0);

  return (
    <div>
      <div className="flex gap-4 mb-3">
        <div className="text-sm"><span className="text-muted-foreground">Příspěvků:</span> <span className="font-medium">{filtered.length}</span></div>
        <div className="text-sm"><span className="text-muted-foreground">Celkový dosah:</span> <span className="font-medium">{fmtNum(totalReach)}</span></div>
        <div className="text-sm"><span className="text-muted-foreground">Náklady:</span> <span className="font-medium">{fmtCurrency(totalCost)}</span></div>
        <div className="text-sm"><span className="text-muted-foreground">Tržby:</span> <span className="font-medium text-green-600">{fmtCurrency(totalRevenue)}</span></div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Datum</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead className="text-right">Lajky</TableHead>
            <TableHead className="text-right">Komentáře</TableHead>
            <TableHead className="text-right">Dosah</TableHead>
            <TableHead className="text-right">Kliky</TableHead>
            <TableHead className="text-right">Konverze</TableHead>
            <TableHead className="text-right">Tržby</TableHead>
            <TableHead className="text-right">Náklady</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(p => (
            <TableRow key={p.id}>
              <TableCell className="text-sm">{fmtDate(p.posted_at)}</TableCell>
              <TableCell><Badge variant="outline" className="text-xs">{p.post_type || "\u2014"}</Badge></TableCell>
              <TableCell className="text-right text-sm">{fmtNum(p.likes)}</TableCell>
              <TableCell className="text-right text-sm">{fmtNum(p.comments)}</TableCell>
              <TableCell className="text-right text-sm">{fmtNum(p.reach)}</TableCell>
              <TableCell className="text-right text-sm">{fmtNum(p.clicks)}</TableCell>
              <TableCell className="text-right text-sm">{fmtNum(p.conversions)}</TableCell>
              <TableCell className="text-right text-sm font-medium text-green-600">{fmtCurrency(p.revenue)}</TableCell>
              <TableCell className="text-right text-sm">{fmtCurrency(p.cost)}</TableCell>
              <TableCell>
                {p.post_url && (
                  <a href={p.post_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5 text-blue-600" /></a>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dialog                                                             */
/* ------------------------------------------------------------------ */

function InfluencerDialog({ influencer, onClose, onSuccess }: { influencer?: Influencer; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!influencer;
  const [name, setName] = useState(influencer?.name || "");
  const [handle, setHandle] = useState(influencer?.handle || "");
  const [platform, setPlatform] = useState(influencer?.platform || "instagram");
  const [followers, setFollowers] = useState(influencer?.followers?.toString() || "");
  const [engagementRate, setEngagementRate] = useState(influencer?.engagement_rate?.toString() || "");
  const [sport, setSport] = useState(influencer?.sport || influencer?.category || "");
  const [email, setEmail] = useState(influencer?.email || influencer?.contact_email || "");
  const [phone, setPhone] = useState(influencer?.phone || "");
  const [costPerPost, setCostPerPost] = useState(influencer?.cost_per_post?.toString() || "");
  const [status, setStatus] = useState(influencer?.status || "prospect");
  const [notes, setNotes] = useState(influencer?.notes || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name, handle, platform,
        followers: followers ? parseInt(followers) : null,
        engagementRate: engagementRate ? parseFloat(engagementRate) : null,
        engagement_rate: engagementRate ? parseFloat(engagementRate) : null,
        sport, category: sport,
        contactEmail: email, email,
        phone, notes, status,
        cost_per_post: costPerPost ? parseFloat(costPerPost) : null,
      };
      if (isEdit) { body.action = "update"; body.id = influencer!.id; }
      const r = await fetch("/api/intelligence/influencers", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Došlo k chybě");
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? "Upravit influencera" : "Nový influencer"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="inf-name">Jméno</Label><Input id="inf-name" value={name} onChange={e => setName(e.target.value)} placeholder="Jan Novák" /></div>
            <div><Label htmlFor="inf-handle">Handle</Label><Input id="inf-handle" value={handle} onChange={e => setHandle(e.target.value)} placeholder="@jannovak" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Platforma</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stav</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(STATUS_CFG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="inf-followers">Sledující</Label><Input id="inf-followers" type="number" value={followers} onChange={e => setFollowers(e.target.value)} placeholder="10000" /></div>
            <div><Label htmlFor="inf-er">Engagement rate (%)</Label><Input id="inf-er" type="number" step="0.01" value={engagementRate} onChange={e => setEngagementRate(e.target.value)} placeholder="3.5" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="inf-sport">Sport / kategorie</Label><Input id="inf-sport" value={sport} onChange={e => setSport(e.target.value)} placeholder="Běh, Cyklistika..." /></div>
            <div><Label htmlFor="inf-cost">Cena za příspěvek (Kč)</Label><Input id="inf-cost" type="number" value={costPerPost} onChange={e => setCostPerPost(e.target.value)} placeholder="5000" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="inf-email">Email</Label><Input id="inf-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jan@email.cz" /></div>
            <div><Label htmlFor="inf-phone">Telefon</Label><Input id="inf-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+420 777 888 999" /></div>
          </div>
          <div><Label htmlFor="inf-notes">Poznámky</Label><Textarea id="inf-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Poznámky ke spolupráci..." rows={2} /></div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Zrušit</Button>
            <Button onClick={handleSubmit} disabled={submitting || !name || !platform}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : isEdit ? <CheckCircle className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {isEdit ? "Uložit" : "Přidat"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
