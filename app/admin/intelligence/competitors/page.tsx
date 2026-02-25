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
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricCard } from "@/components/admin/MetricCard";
import {
  Eye, Plus, Trash2, Loader2, Pencil, RefreshCw, ExternalLink,
  TrendingDown, TrendingUp, Store, DollarSign, BarChart3, CheckCircle,
} from "lucide-react";
import { useState, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Competitor {
  id: number;
  name: string;
  url: string;
  description: string | null;
  brands: string | null;
  categories: string | null;
  monitoring_enabled: number;
  track_prices?: number;
  notes?: string | null;
  last_checked_at: number | null;
  created_at: number;
  updated_at: number;
}

interface CompetitorPrice {
  id: number;
  competitor_id: number;
  product_name: string;
  product_url: string | null;
  our_product_id: string | null;
  competitor_price: number;
  our_price: number;
  price_difference: number;
  currency: string;
  checked_at: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtCurrency(v: number): string {
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(v);
}

function fmtDate(ts: number | null): string {
  if (!ts) return "\u2014";
  return new Date(ts * 1000).toLocaleString("cs-CZ", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function parseJson(val: string | null): string[] {
  if (!val) return [];
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; }
  catch { return val.split(",").map(s => s.trim()).filter(Boolean); }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CompetitorsPage() {
  const { user } = useAdminAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Competitor | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  /* ---------- queries ---------- */

  const { data: competitors, isLoading } = useQuery({
    queryKey: ["intel-competitors"],
    queryFn: async () => {
      const r = await fetch("/api/intelligence/competitors");
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      return j.data as Competitor[];
    },
  });

  const { data: prices, isLoading: pricesLoading } = useQuery({
    queryKey: ["intel-competitor-prices", selected],
    queryFn: async () => {
      const url = selected
        ? `/api/intelligence/competitors?action=prices&competitor_id=${selected}`
        : "/api/intelligence/competitors?action=prices";
      const r = await fetch(url);
      const j = await r.json();
      return (j.success ? j.data : []) as CompetitorPrice[];
    },
  });

  /* ---------- mutations ---------- */

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch("/api/intelligence/competitors", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intel-competitors"] }),
  });

  const checkMut = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/intelligence/competitors", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_prices" }),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intel-competitors"] });
      qc.invalidateQueries({ queryKey: ["intel-competitor-prices"] });
    },
  });

  /* ---------- derived ---------- */

  const filtered = useMemo(() => {
    if (!competitors) return [];
    if (!search) return competitors;
    const q = search.toLowerCase();
    return competitors.filter(c =>
      c.name.toLowerCase().includes(q) || c.url.toLowerCase().includes(q) || (c.description?.toLowerCase().includes(q))
    );
  }, [competitors, search]);

  const stats = useMemo(() => {
    const total = competitors?.length || 0;
    const monitoring = competitors?.filter(c => c.monitoring_enabled || c.track_prices).length || 0;
    const cheaper = prices?.filter(p => p.price_difference < 0).length || 0;
    const avg = prices?.length ? prices.reduce((s, p) => s + (p.price_difference || 0), 0) / prices.length : 0;
    return { total, monitoring, cheaper, avg };
  }, [competitors, prices]);

  /* ---------- render ---------- */

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Konkurence</h1>
            <p className="text-muted-foreground">Monitoring konkurenčních e-shopů a porovnání cen</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => checkMut.mutate()} disabled={checkMut.isPending}>
              {checkMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Zkontrolovat ceny
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Přidat konkurenta
            </Button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard title="Celkem konkurentů" value={stats.total} icon={Store} description={`${stats.monitoring} s monitoringem`} />
          <MetricCard title="Levnějších produktů" value={stats.cheaper} icon={TrendingDown} description="Konkurence má nižší cenu" trend={stats.cheaper > 0 ? "down" : "neutral"} />
          <MetricCard title="Průměrný cenový rozdíl" value={fmtCurrency(stats.avg)} icon={DollarSign} description="Naše cena vs. konkurence" trend={stats.avg > 0 ? "up" : stats.avg < 0 ? "down" : "neutral"} />
          <MetricCard title="Sledovaných produktů" value={prices?.length || 0} icon={BarChart3} description="Cenové porovnání" />
        </div>

        {/* Search */}
        <div className="mb-4">
          <Input placeholder="Hledat konkurenta..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center gap-2 py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /><span>Načítání...</span></div>
        ) : !filtered.length ? (
          <EmptyState icon={Eye} title="Žádní konkurenti" description="Přidejte prvního konkurenta pro sledování cen a aktivit."
            action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />Přidat konkurenta</Button>} />
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" />Konkurenti ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Název</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Značky</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Monitoring</TableHead>
                    <TableHead>Poslední kontrola</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => (
                    <TableRow key={c.id} className={selected === c.id ? "bg-accent" : "cursor-pointer hover:bg-accent/50"} onClick={() => setSelected(selected === c.id ? null : c.id)}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><Store className="h-4 w-4 text-primary" /></div>
                          <div>
                            <div>{c.name}</div>
                            {c.description && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{c.description}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          {(() => { try { return new URL(c.url).hostname; } catch { return c.url; } })()}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {parseJson(c.brands).slice(0, 3).map(b => <Badge key={b} variant="outline" className="text-xs">{b}</Badge>)}
                          {parseJson(c.brands).length > 3 && <Badge variant="outline" className="text-xs">+{parseJson(c.brands).length - 3}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {parseJson(c.categories).slice(0, 2).map(cat => <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={(c.monitoring_enabled || c.track_prices) ? "default" : "secondary"}>
                          {(c.monitoring_enabled || c.track_prices) ? "Aktivní" : "Neaktivní"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDate(c.last_checked_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" onClick={() => setEditItem(c)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => { if (confirm(`Opravdu smazat ${c.name}?`)) deleteMut.mutate(c.id); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Price Comparison */}
        {prices && prices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cenové porovnání
                {selected && <Badge variant="outline" className="ml-2">{competitors?.find(c => c.id === selected)?.name}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pricesLoading ? (
                <div className="flex items-center gap-2 py-8 justify-center"><Loader2 className="h-5 w-5 animate-spin" /><span>Načítání cen...</span></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produkt</TableHead>
                      <TableHead className="text-right">Naše cena</TableHead>
                      <TableHead className="text-right">Cena konkurence</TableHead>
                      <TableHead className="text-right">Rozdíl</TableHead>
                      <TableHead>Stav</TableHead>
                      <TableHead>Zkontrolováno</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prices.map(p => {
                      const pct = p.our_price > 0 ? ((p.competitor_price - p.our_price) / p.our_price) * 100 : 0;
                      const ours = p.price_difference > 0;
                      const theirs = p.price_difference < 0;
                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="font-medium">{p.product_name}</div>
                            {p.product_url && (
                              <a href={p.product_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                Zobrazit u konkurence <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">{fmtCurrency(p.our_price)}</TableCell>
                          <TableCell className="text-right font-medium">{fmtCurrency(p.competitor_price)}</TableCell>
                          <TableCell className="text-right">
                            <span className={ours ? "text-green-600 font-medium" : theirs ? "text-red-600 font-medium" : "text-muted-foreground"}>
                              {p.price_difference > 0 ? "+" : ""}{fmtCurrency(p.price_difference)}
                              <span className="text-xs ml-1">({pct > 0 ? "+" : ""}{pct.toFixed(1)}%)</span>
                            </span>
                          </TableCell>
                          <TableCell>
                            {ours ? <Badge className="bg-green-100 text-green-800"><TrendingUp className="h-3 w-3 mr-1" />Levnější</Badge>
                              : theirs ? <Badge className="bg-red-100 text-red-800"><TrendingDown className="h-3 w-3 mr-1" />Dražší</Badge>
                              : <Badge variant="secondary">Stejná cena</Badge>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{fmtDate(p.checked_at)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        {showCreate && (
          <CompetitorDialog onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ["intel-competitors"] }); }} />
        )}
        {editItem && (
          <CompetitorDialog competitor={editItem} onClose={() => setEditItem(null)} onSuccess={() => { setEditItem(null); qc.invalidateQueries({ queryKey: ["intel-competitors"] }); }} />
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dialog                                                             */
/* ------------------------------------------------------------------ */

function CompetitorDialog({ competitor, onClose, onSuccess }: { competitor?: Competitor; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!competitor;
  const [name, setName] = useState(competitor?.name || "");
  const [url, setUrl] = useState(competitor?.url || "");
  const [description, setDescription] = useState(competitor?.description || competitor?.notes || "");
  const [brands, setBrands] = useState(competitor?.brands ? parseJson(competitor.brands).join(", ") : "");
  const [categories, setCategories] = useState(competitor?.categories ? parseJson(competitor.categories).join(", ") : "");
  const [monitoring, setMonitoring] = useState(!!(competitor?.monitoring_enabled || competitor?.track_prices));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name, url,
        notes: description,
        description,
        brands: brands ? JSON.stringify(brands.split(",").map(s => s.trim()).filter(Boolean)) : null,
        categories: categories ? JSON.stringify(categories.split(",").map(s => s.trim()).filter(Boolean)) : null,
        trackPrices: monitoring,
        monitoring_enabled: monitoring ? 1 : 0,
      };
      if (isEdit) { body.action = "update"; body.id = competitor!.id; }
      const r = await fetch("/api/intelligence/competitors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Došlo k chybě");
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Upravit konkurenta" : "Nový konkurent"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div><Label htmlFor="c-name">Název</Label><Input id="c-name" value={name} onChange={e => setName(e.target.value)} placeholder="Sportisimo, Decathlon..." /></div>
          <div><Label htmlFor="c-url">URL</Label><Input id="c-url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.sportisimo.cz" /></div>
          <div><Label htmlFor="c-desc">Popis</Label><Textarea id="c-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Krátký popis konkurenta..." rows={2} /></div>
          <div><Label htmlFor="c-brands">Značky (oddělené čárkou)</Label><Input id="c-brands" value={brands} onChange={e => setBrands(e.target.value)} placeholder="Nike, Adidas, Puma..." /></div>
          <div><Label htmlFor="c-cats">Kategorie (oddělené čárkou)</Label><Input id="c-cats" value={categories} onChange={e => setCategories(e.target.value)} placeholder="Běhání, Cyklistika, Fitness..." /></div>
          <div className="flex items-center gap-3">
            <Switch id="c-mon" checked={monitoring} onCheckedChange={setMonitoring} />
            <Label htmlFor="c-mon">Aktivní monitoring cen</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Zrušit</Button>
            <Button onClick={handleSubmit} disabled={submitting || !name || !url}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : isEdit ? <CheckCircle className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {isEdit ? "Uložit" : "Přidat"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
