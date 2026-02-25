"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricCard } from "@/components/admin/MetricCard";
import {
  Link2, Plus, Loader2, Copy, Check, ExternalLink, Trash2,
  MousePointer, Target, DollarSign, BarChart3, Zap,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UTMCampaign {
  id: number;
  name: string;
  base_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string | null;
  utm_term: string | null;
  full_url: string;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  url?: string;
  generated_url?: string;
  clicks: number | null;
  conversions: number | null;
  revenue: number | null;
  notes: string | null;
  created_at: number;
  created_by?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants - Quick Templates                                        */
/* ------------------------------------------------------------------ */

const TEMPLATES: { name: string; source: string; medium: string; icon: string }[] = [
  { name: "Facebook", source: "facebook", medium: "social", icon: "FB" },
  { name: "Instagram", source: "instagram", medium: "social", icon: "IG" },
  { name: "Google Ads", source: "google", medium: "cpc", icon: "GA" },
  { name: "Email", source: "newsletter", medium: "email", icon: "EM" },
  { name: "Sklik", source: "sklik", medium: "cpc", icon: "SK" },
  { name: "Heureka", source: "heureka", medium: "cpc", icon: "HE" },
  { name: "Zbozi.cz", source: "zbozi", medium: "cpc", icon: "ZB" },
  { name: "TikTok", source: "tiktok", medium: "social", icon: "TT" },
  { name: "YouTube", source: "youtube", medium: "video", icon: "YT" },
  { name: "Blog", source: "blog", medium: "referral", icon: "BL" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtNum(v: number | null): string {
  if (v == null) return "\u2014";
  return v.toLocaleString("cs-CZ");
}

function fmtCurrency(v: number | null): string {
  if (v == null) return "\u2014";
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(v);
}

function fmtDate(ts: number | null): string {
  if (!ts) return "\u2014";
  return new Date(ts * 1000).toLocaleDateString("cs-CZ", { day: "numeric", month: "short", year: "numeric" });
}

function buildUtmUrl(baseUrl: string, source: string, medium: string, campaign: string, content?: string, term?: string): string {
  try {
    const url = new URL(baseUrl);
    if (source) url.searchParams.set("utm_source", source);
    if (medium) url.searchParams.set("utm_medium", medium);
    if (campaign) url.searchParams.set("utm_campaign", campaign);
    if (content) url.searchParams.set("utm_content", content);
    if (term) url.searchParams.set("utm_term", term);
    return url.toString();
  } catch {
    return baseUrl;
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function UTMBuilderPage() {
  const { user } = useAdminAuth();
  const qc = useQueryClient();

  /* form state */
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://www.qsport.cz");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [term, setTerm] = useState("");
  const [copied, setCopied] = useState(false);

  /* ---------- queries ---------- */

  const { data, isLoading } = useQuery({
    queryKey: ["intel-utm"],
    queryFn: async () => {
      const r = await fetch("/api/intelligence/utm?limit=100");
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      return j.data as { campaigns: UTMCampaign[]; total: number };
    },
  });

  const campaigns = data?.campaigns || [];

  /* ---------- mutations ---------- */

  const saveMut = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/intelligence/utm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, baseUrl, source, medium, campaign, content: content || undefined, term: term || undefined }),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      return j.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intel-utm"] });
      setName("");
      setCampaign("");
      setContent("");
      setTerm("");
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch("/api/intelligence/utm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intel-utm"] }),
  });

  /* ---------- derived ---------- */

  const generatedUrl = useMemo(
    () => buildUtmUrl(baseUrl, source, medium, campaign, content, term),
    [baseUrl, source, medium, campaign, content, term]
  );

  const canSave = name && baseUrl && source && medium && campaign;

  const stats = useMemo(() => {
    const totalClicks = campaigns.reduce((s, c) => s + (c.clicks || 0), 0);
    const totalConv = campaigns.reduce((s, c) => s + (c.conversions || 0), 0);
    const totalRev = campaigns.reduce((s, c) => s + (c.revenue || 0), 0);
    return { total: campaigns.length, totalClicks, totalConv, totalRev };
  }, [campaigns]);

  /* ---------- handlers ---------- */

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  }, []);

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setSource(t.source);
    setMedium(t.medium);
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">UTM Builder</h1>
          <p className="text-muted-foreground">Generování UTM parametrů pro marketingové kampaně</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard title="Vytvořených UTM" value={stats.total} icon={Link2} description="Celkem uložených" />
          <MetricCard title="Celkem kliků" value={fmtNum(stats.totalClicks)} icon={MousePointer} description="Ze všech kampaní" />
          <MetricCard title="Celkem konverzí" value={fmtNum(stats.totalConv)} icon={Target} description="Dokončené cíle" />
          <MetricCard title="Celkové tržby" value={fmtCurrency(stats.totalRev)} icon={DollarSign} description="Z UTM kampaní" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* UTM Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" />Vytvořit UTM odkaz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick templates */}
              <div>
                <Label className="mb-2 block">Rychlé šablony</Label>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map(t => (
                    <Button key={t.name} variant="outline" size="sm" onClick={() => applyTemplate(t)}
                      className={source === t.source && medium === t.medium ? "border-primary bg-primary/5" : ""}>
                      <span className="font-bold text-xs mr-1.5 bg-muted px-1.5 py-0.5 rounded">{t.icon}</span>
                      {t.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="utm-name">Název kampaně *</Label>
                <Input id="utm-name" value={name} onChange={e => setName(e.target.value)} placeholder="Letní výprodej 2026 – Facebook" />
              </div>
              <div>
                <Label htmlFor="utm-base">Cílová URL *</Label>
                <Input id="utm-base" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://www.qsport.cz/letni-vyprodej" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="utm-source">utm_source *</Label>
                  <Input id="utm-source" value={source} onChange={e => setSource(e.target.value)} placeholder="facebook, google, newsletter..." />
                  <p className="text-xs text-muted-foreground mt-1">Zdroj návštěvnosti</p>
                </div>
                <div>
                  <Label htmlFor="utm-medium">utm_medium *</Label>
                  <Input id="utm-medium" value={medium} onChange={e => setMedium(e.target.value)} placeholder="cpc, email, social..." />
                  <p className="text-xs text-muted-foreground mt-1">Typ média</p>
                </div>
              </div>
              <div>
                <Label htmlFor="utm-campaign">utm_campaign *</Label>
                <Input id="utm-campaign" value={campaign} onChange={e => setCampaign(e.target.value)} placeholder="letni-vyprodej-2026" />
                <p className="text-xs text-muted-foreground mt-1">Název kampaně (bez diakritiky, s pomlčkami)</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="utm-content">utm_content</Label>
                  <Input id="utm-content" value={content} onChange={e => setContent(e.target.value)} placeholder="banner-hlavni, cta-tlacitko..." />
                  <p className="text-xs text-muted-foreground mt-1">Varianta reklamy</p>
                </div>
                <div>
                  <Label htmlFor="utm-term">utm_term</Label>
                  <Input id="utm-term" value={term} onChange={e => setTerm(e.target.value)} placeholder="bezecke-boty, treningove-obleceni..." />
                  <p className="text-xs text-muted-foreground mt-1">Klíčové slovo</p>
                </div>
              </div>

              {/* Live Preview */}
              {source && medium && campaign && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <Label className="mb-2 block text-sm font-medium">Náhled vygenerované URL</Label>
                  <div className="flex items-start gap-2">
                    <code className="text-xs break-all flex-1 bg-background p-2 rounded border">{generatedUrl}</code>
                    <Button variant="outline" size="sm" onClick={() => handleCopy(generatedUrl)}>
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button onClick={() => { setName(""); setSource(""); setMedium(""); setCampaign(""); setContent(""); setTerm(""); }} variant="outline">
                  Vyčistit
                </Button>
                <Button onClick={() => saveMut.mutate()} disabled={!canSave || saveMut.isPending}>
                  {saveMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Uložit UTM
                </Button>
              </div>
              {saveMut.isError && <p className="text-sm text-red-500">{(saveMut.error as Error).message}</p>}
              {saveMut.isSuccess && <p className="text-sm text-green-600">UTM odkaz byl úspěšně uložen.</p>}
            </CardContent>
          </Card>

          {/* Quick reference */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" />Nápověda k parametrům</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium">utm_source <Badge variant="outline" className="ml-1 text-[10px]">povinné</Badge></p>
                <p className="text-muted-foreground">Identifikuje zdroj návštěvnosti (facebook, google, newsletter)</p>
              </div>
              <div>
                <p className="font-medium">utm_medium <Badge variant="outline" className="ml-1 text-[10px]">povinné</Badge></p>
                <p className="text-muted-foreground">Typ média (cpc, email, social, banner, referral)</p>
              </div>
              <div>
                <p className="font-medium">utm_campaign <Badge variant="outline" className="ml-1 text-[10px]">povinné</Badge></p>
                <p className="text-muted-foreground">Název kampaně bez diakritiky (letni-vyprodej-2026)</p>
              </div>
              <div>
                <p className="font-medium">utm_content <Badge variant="outline" className="ml-1 text-[10px]">volitelné</Badge></p>
                <p className="text-muted-foreground">Rozlišení variant reklamy (banner-top, cta-button)</p>
              </div>
              <div>
                <p className="font-medium">utm_term <Badge variant="outline" className="ml-1 text-[10px]">volitelné</Badge></p>
                <p className="text-muted-foreground">Klíčové slovo pro PPC kampaně</p>
              </div>
              <div className="border-t pt-3 mt-3">
                <p className="font-medium mb-1">Doporučení</p>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Používejte malá písmena</li>
                  <li>Místo mezer používejte pomlčky</li>
                  <li>Nepoužívejte diakritiku</li>
                  <li>Udržujte konzistentní pojmenování</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History Table */}
        {isLoading ? (
          <div className="flex items-center gap-2 py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /><span>Načítání...</span></div>
        ) : !campaigns.length ? (
          <EmptyState icon={Link2} title="Žádné UTM odkazy" description="Vytvořte první UTM odkaz pomocí formuláře výše." />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Historie UTM odkazů ({campaigns.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Název</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Medium</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead className="text-right">Kliky</TableHead>
                    <TableHead className="text-right">Konverze</TableHead>
                    <TableHead className="text-right">Tržby</TableHead>
                    <TableHead>Vytvořeno</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map(c => {
                    const fullUrl = c.full_url || c.generated_url || "";
                    const src = c.utm_source || c.source || "";
                    const med = c.utm_medium || c.medium || "";
                    const camp = c.utm_campaign || c.campaign || "";
                    const cont = c.utm_content || c.content || "";
                    const trm = c.utm_term || c.term || "";
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{c.name}</div>
                            {(cont || trm) && (
                              <div className="flex gap-1 mt-0.5">
                                {cont && <Badge variant="outline" className="text-[10px]">content: {cont}</Badge>}
                                {trm && <Badge variant="outline" className="text-[10px]">term: {trm}</Badge>}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{src}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{med}</Badge></TableCell>
                        <TableCell><span className="text-sm">{camp}</span></TableCell>
                        <TableCell className="text-right font-medium">{fmtNum(c.clicks)}</TableCell>
                        <TableCell className="text-right">{fmtNum(c.conversions)}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">{fmtCurrency(c.revenue)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(c.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleCopy(fullUrl)} title="Kopírovat URL">
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            {fullUrl && (
                              <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm"><ExternalLink className="h-3.5 w-3.5" /></Button>
                              </a>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => { if (confirm(`Opravdu smazat "${c.name}"?`)) deleteMut.mutate(c.id); }}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
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
      </main>
    </div>
  );
}
