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
  Calendar, Plus, Trash2, Loader2, Pencil, CheckCircle,
  Sun, Snowflake, Tag, Trophy, Zap, Filter,
  CalendarDays, Clock, AlertTriangle, Star,
} from "lucide-react";
import { useState, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SeasonalEvent {
  id?: number;
  name: string;
  type: string;
  description: string | null;
  start_date: string;
  end_date: string;
  categories: string | null;
  brands: string | null;
  marketing_actions: string | null;
  priority: string;
  status: string;
  category?: string;
  year?: string;
  created_at?: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TYPE_OPTIONS: { value: string; label: string; icon: typeof Calendar }[] = [
  { value: "sport_season", label: "Sportovní sezóna", icon: Trophy },
  { value: "holiday", label: "Svátek", icon: Star },
  { value: "sale", label: "Výprodej", icon: Tag },
  { value: "event", label: "Událost", icon: Zap },
  { value: "custom", label: "Vlastní", icon: CalendarDays },
  { value: "season", label: "Sezóna", icon: Sun },
  { value: "campaign", label: "Kampaň", icon: Tag },
];

const TYPE_LABELS: Record<string, string> = Object.fromEntries(TYPE_OPTIONS.map(t => [t.value, t.label]));

const PRIORITY_CFG: Record<string, { label: string; color: string }> = {
  low: { label: "Nízká", color: "bg-gray-100 text-gray-800" },
  medium: { label: "Střední", color: "bg-blue-100 text-blue-800" },
  high: { label: "Vysoká", color: "bg-orange-100 text-orange-800" },
  critical: { label: "Kritická", color: "bg-red-100 text-red-800" },
};

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  planned: { label: "Plánováno", color: "bg-gray-100 text-gray-800" },
  active: { label: "Aktivní", color: "bg-green-100 text-green-800" },
  completed: { label: "Dokončeno", color: "bg-blue-100 text-blue-800" },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtDateShort(d: string | null): string {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("cs-CZ", { day: "numeric", month: "short" });
}

function fmtDateFull(d: string | null): string {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
}

function parseJson(val: string | null): string[] {
  if (!val) return [];
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; }
  catch { return val.split(",").map(s => s.trim()).filter(Boolean); }
}

function isCurrentOrUpcoming(e: SeasonalEvent): "current" | "upcoming" | "past" | "future" {
  const now = new Date();
  const start = new Date(e.start_date);
  const end = new Date(e.end_date);
  if (now >= start && now <= end) return "current";
  const inTwoWeeks = new Date(now.getTime() + 14 * 86400000);
  if (start > now && start <= inTwoWeeks) return "upcoming";
  if (end < now) return "past";
  return "future";
}

function daysUntil(d: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SeasonalCalendarPage() {
  const { user } = useAdminAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<SeasonalEvent | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const { data: events, isLoading } = useQuery({
    queryKey: ["intel-seasonal", year],
    queryFn: async () => {
      const r = await fetch(`/api/intelligence/seasonal?year=${year}`);
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      return j.data as SeasonalEvent[];
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch("/api/intelligence/seasonal", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intel-seasonal"] }),
  });

  /* ---------- derived ---------- */

  const filtered = useMemo(() => {
    if (!events) return [];
    return events.filter(e => {
      const type = e.type || e.category || "";
      if (filterType !== "all" && type !== filterType) return false;
      if (filterPriority !== "all" && e.priority !== filterPriority) return false;
      if (filterStatus !== "all" && e.status !== filterStatus) return false;
      return true;
    });
  }, [events, filterType, filterPriority, filterStatus]);

  const stats = useMemo(() => {
    const total = events?.length || 0;
    const active = events?.filter(e => isCurrentOrUpcoming(e) === "current").length || 0;
    const upcoming = events?.filter(e => isCurrentOrUpcoming(e) === "upcoming").length || 0;
    const critical = events?.filter(e => e.priority === "critical" || e.priority === "high").length || 0;
    return { total, active, upcoming, critical };
  }, [events]);

  /* Timeline bar width helper */
  const getTimelineBar = (e: SeasonalEvent) => {
    const yearStart = new Date(`${year}-01-01`).getTime();
    const yearEnd = new Date(`${year}-12-31`).getTime();
    const totalMs = yearEnd - yearStart;
    const start = Math.max(new Date(e.start_date).getTime(), yearStart);
    const end = Math.min(new Date(e.end_date).getTime(), yearEnd);
    const left = ((start - yearStart) / totalMs) * 100;
    const width = Math.max(((end - start) / totalMs) * 100, 1);
    return { left: `${left}%`, width: `${width}%` };
  };

  const getBarColor = (e: SeasonalEvent) => {
    const st = isCurrentOrUpcoming(e);
    if (st === "current") return "bg-green-500";
    if (st === "upcoming") return "bg-orange-400";
    if (st === "past") return "bg-gray-300";
    return "bg-blue-400";
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Sezónní kalendář</h1>
            <p className="text-muted-foreground">Plánování kampaní podle sezón, svátků a akcí</p>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Přidat událost
            </Button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard title="Celkem událostí" value={stats.total} icon={CalendarDays} description={`Rok ${year}`} />
          <MetricCard title="Probíhající" value={stats.active} icon={Zap} description="Právě aktivní" trend={stats.active > 0 ? "up" : "neutral"} />
          <MetricCard title="Nadcházející" value={stats.upcoming} icon={Clock} description="V příštích 14 dnech" />
          <MetricCard title="Vysoká priorita" value={stats.critical} icon={AlertTriangle} description="Vysoká / kritická" trend={stats.critical > 0 ? "up" : "neutral"} />
        </div>

        {/* Timeline */}
        {filtered.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Časová osa {year}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Month labels */}
              <div className="relative h-6 mb-2">
                {["Led", "Úno", "Bře", "Dub", "Kvě", "Čvn", "Čvc", "Srp", "Zář", "Říj", "Lis", "Pro"].map((m, i) => (
                  <span key={m} className="absolute text-xs text-muted-foreground" style={{ left: `${(i / 12) * 100}%` }}>{m}</span>
                ))}
              </div>
              {/* Bars */}
              <div className="space-y-1.5">
                {filtered.map((e, i) => {
                  const bar = getTimelineBar(e);
                  const timing = isCurrentOrUpcoming(e);
                  return (
                    <div key={e.id || i} className="relative h-7 bg-muted/30 rounded group">
                      <div className={`absolute h-full rounded ${getBarColor(e)} opacity-80 flex items-center px-2 overflow-hidden`} style={bar}>
                        <span className="text-xs text-white font-medium truncate">{e.name}</span>
                      </div>
                      {timing === "current" && (
                        <div className="absolute right-1 top-1"><Badge className="bg-green-600 text-white text-[10px] py-0">Nyní</Badge></div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Today marker */}
              {(() => {
                const now = new Date();
                const yearStart = new Date(`${year}-01-01`).getTime();
                const yearEnd = new Date(`${year}-12-31`).getTime();
                const pct = ((now.getTime() - yearStart) / (yearEnd - yearStart)) * 100;
                if (pct < 0 || pct > 100) return null;
                return <div className="relative h-0 mt-1"><div className="absolute w-0.5 h-full bg-red-500 -top-[calc(100%+0.5rem)]" style={{ left: `${pct}%`, height: `${filtered.length * 34 + 24}px` }} /><span className="absolute text-[10px] text-red-500 font-medium -translate-x-1/2" style={{ left: `${pct}%` }}>Dnes</span></div>;
              })()}
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Typ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny typy</SelectItem>
              {TYPE_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Priorita" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny priority</SelectItem>
              {Object.entries(PRIORITY_CFG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
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
          <EmptyState icon={Calendar} title="Žádné události" description="Přidejte sezónní události pro plánování kampaní."
            action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />Přidat událost</Button>} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" />Události ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Název</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Priorita</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e, i) => {
                    const timing = isCurrentOrUpcoming(e);
                    const days = daysUntil(e.start_date);
                    const priCfg = PRIORITY_CFG[e.priority] || PRIORITY_CFG.medium;
                    const stCfg = STATUS_CFG[e.status] || STATUS_CFG.planned;
                    const typeLabel = TYPE_LABELS[e.type || e.category || ""] || e.type || e.category || "\u2014";
                    return (
                      <TableRow key={e.id || i} className={timing === "current" ? "bg-green-50 dark:bg-green-950/20" : timing === "upcoming" ? "bg-orange-50 dark:bg-orange-950/20" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium flex items-center gap-1.5">
                                {e.name}
                                {timing === "current" && <Badge className="bg-green-600 text-white text-[10px] py-0">Probíhá</Badge>}
                                {timing === "upcoming" && <Badge className="bg-orange-500 text-white text-[10px] py-0">Za {days} dní</Badge>}
                              </div>
                              {e.description && <div className="text-xs text-muted-foreground truncate max-w-[250px]">{e.description}</div>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{typeLabel}</Badge></TableCell>
                        <TableCell>
                          <div className="text-sm">{fmtDateShort(e.start_date)} – {fmtDateShort(e.end_date)}</div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className={priCfg.color}>{priCfg.label}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className={stCfg.color}>{stCfg.label}</Badge></TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {parseJson(e.categories).slice(0, 2).map(c => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setEditItem(e)}><Pencil className="h-4 w-4" /></Button>
                            {e.id && (
                              <Button variant="ghost" size="sm" onClick={() => { if (confirm(`Opravdu smazat ${e.name}?`)) deleteMut.mutate(e.id!); }}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        {showCreate && (
          <EventDialog year={year} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ["intel-seasonal"] }); }} />
        )}
        {editItem && (
          <EventDialog event={editItem} year={year} onClose={() => setEditItem(null)} onSuccess={() => { setEditItem(null); qc.invalidateQueries({ queryKey: ["intel-seasonal"] }); }} />
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dialog                                                             */
/* ------------------------------------------------------------------ */

function EventDialog({ event, year, onClose, onSuccess }: { event?: SeasonalEvent; year: string; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!event;
  const [name, setName] = useState(event?.name || "");
  const [type, setType] = useState(event?.type || event?.category || "sport_season");
  const [description, setDescription] = useState(event?.description || "");
  const [startDate, setStartDate] = useState(event?.start_date || `${year}-01-01`);
  const [endDate, setEndDate] = useState(event?.end_date || `${year}-01-15`);
  const [priority, setPriority] = useState(event?.priority || "medium");
  const [status, setStatus] = useState(event?.status || "planned");
  const [categories, setCategories] = useState(event?.categories ? parseJson(event.categories).join(", ") : "");
  const [brands, setBrands] = useState(event?.brands ? parseJson(event.brands).join(", ") : "");
  const [actions, setActions] = useState(event?.marketing_actions ? parseJson(event.marketing_actions).join(", ") : "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name, type, description,
        start_date: startDate, end_date: endDate,
        priority, status, year,
        categories: categories ? JSON.stringify(categories.split(",").map(s => s.trim()).filter(Boolean)) : null,
        brands: brands ? JSON.stringify(brands.split(",").map(s => s.trim()).filter(Boolean)) : null,
        marketing_actions: actions ? JSON.stringify(actions.split(",").map(s => s.trim()).filter(Boolean)) : null,
      };
      if (isEdit && event?.id) { body.action = "update"; body.id = event.id; }
      const r = await fetch("/api/intelligence/seasonal", {
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
        <DialogHeader><DialogTitle>{isEdit ? "Upravit událost" : "Nová událost"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div><Label htmlFor="ev-name">Název</Label><Input id="ev-name" value={name} onChange={e => setName(e.target.value)} placeholder="Black Friday, Lyžařská sezóna..." /></div>
          <div>
            <Label htmlFor="ev-type">Typ</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label htmlFor="ev-desc">Popis</Label><Textarea id="ev-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Popis události..." rows={2} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="ev-start">Začátek</Label><Input id="ev-start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div><Label htmlFor="ev-end">Konec</Label><Input id="ev-end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priorita</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CFG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stav</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CFG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label htmlFor="ev-cats">Kategorie (oddělené čárkou)</Label><Input id="ev-cats" value={categories} onChange={e => setCategories(e.target.value)} placeholder="Lyžování, Snowboard..." /></div>
          <div><Label htmlFor="ev-brands">Značky (oddělené čárkou)</Label><Input id="ev-brands" value={brands} onChange={e => setBrands(e.target.value)} placeholder="Salomon, Head..." /></div>
          <div><Label htmlFor="ev-actions">Marketingové akce (oddělené čárkou)</Label><Input id="ev-actions" value={actions} onChange={e => setActions(e.target.value)} placeholder="Email kampaň, Social posty, PPC reklama..." /></div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Zrušit</Button>
            <Button onClick={handleSubmit} disabled={submitting || !name || !startDate || !endDate}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : isEdit ? <CheckCircle className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {isEdit ? "Uložit" : "Přidat"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
