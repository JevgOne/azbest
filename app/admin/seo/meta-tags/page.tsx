"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricCard } from "@/components/admin/MetricCard";
import {
  FileText, Loader2, Search, CheckCircle2, XCircle, AlertTriangle,
  Tag, ChevronDown, ChevronUp, Lightbulb,
  Package, ExternalLink, Globe,
} from "lucide-react";
import { useState, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Product {
  id: number;
  shoptet_id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  images: string | null;
  category: string | null;
  brand: string | null;
  price: number;
}

interface MetaAnalysis {
  url: string;
  title: string | null;
  titleLength: number;
  titleOk: boolean;
  description: string | null;
  descriptionLength: number;
  descriptionOk: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterCard: string | null;
  robots: string | null;
  allMetaTags: Record<string, string | null>;
}

interface ProductMetaResult {
  productId: number;
  productName: string;
  slug: string;
  category: string | null;
  titleText: string;
  titleLength: number;
  titleStatus: "ok" | "short" | "long" | "missing";
  descriptionText: string;
  descriptionLength: number;
  descriptionStatus: "ok" | "short" | "long" | "missing";
  hasKeywords: boolean;
  suggestions: string[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function analyzeProductMeta(product: Product): ProductMetaResult {
  const titleText = product.name || "";
  const titleLength = titleText.length;
  const descriptionText = product.short_description || product.description?.replace(/<[^>]*>/g, "").substring(0, 300) || "";
  const descriptionLength = descriptionText.length;

  let titleStatus: "ok" | "short" | "long" | "missing" = "ok";
  if (!titleText) titleStatus = "missing";
  else if (titleLength < 30) titleStatus = "short";
  else if (titleLength > 60) titleStatus = "long";

  let descriptionStatus: "ok" | "short" | "long" | "missing" = "ok";
  if (!descriptionText) descriptionStatus = "missing";
  else if (descriptionLength < 120) descriptionStatus = "short";
  else if (descriptionLength > 160) descriptionStatus = "long";

  const brandKeyword = product.brand?.toLowerCase() || "";
  const categoryKeyword = product.category?.toLowerCase() || "";
  const hasKeywords = !!(
    (brandKeyword && titleText.toLowerCase().includes(brandKeyword)) ||
    (categoryKeyword && titleText.toLowerCase().includes(categoryKeyword))
  );

  const suggestions: string[] = [];
  if (titleStatus === "missing") suggestions.push("Pridejte nazev produktu jako title tag.");
  if (titleStatus === "short") suggestions.push(`Title je kratky (${titleLength} znaku). Doplnte klicova slova pro 30-60 znaku.`);
  if (titleStatus === "long") suggestions.push(`Title je dlouhy (${titleLength} znaku). Zkratte na max 60 znaku.`);
  if (descriptionStatus === "missing") suggestions.push("Chybi popis produktu - pridejte meta description 120-160 znaku.");
  if (descriptionStatus === "short") suggestions.push(`Popis je kratky (${descriptionLength} znaku). Rozsirte na 120-160 znaku.`);
  if (descriptionStatus === "long") suggestions.push(`Popis je dlouhy (${descriptionLength} znaku). Zkratte na max 160 znaku.`);
  if (!hasKeywords && product.brand) suggestions.push(`Zahrnte znacku "${product.brand}" do title tagu.`);

  return {
    productId: product.id,
    productName: product.name,
    slug: product.slug,
    category: product.category,
    titleText,
    titleLength,
    titleStatus,
    descriptionText,
    descriptionLength,
    descriptionStatus,
    hasKeywords,
    suggestions,
  };
}

function getStatusBadge(status: "ok" | "short" | "long" | "missing") {
  switch (status) {
    case "ok":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-0"><CheckCircle2 className="h-3 w-3 mr-1" />OK</Badge>;
    case "short":
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-0"><AlertTriangle className="h-3 w-3 mr-1" />Kratky</Badge>;
    case "long":
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-0"><AlertTriangle className="h-3 w-3 mr-1" />Dlouhy</Badge>;
    case "missing":
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-0"><XCircle className="h-3 w-3 mr-1" />Chybi</Badge>;
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SEOMetaTagsPage() {
  const { user } = useAdminAuth();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [urlAnalysis, setUrlAnalysis] = useState<MetaAnalysis | null>(null);
  const [showUrlDialog, setShowUrlDialog] = useState(false);

  /* ---------- queries ---------- */

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["seo-meta-products"],
    queryFn: async () => {
      const r = await fetch("/api/shoptet/products?limit=500&offset=0");
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      return j.data as { products: Product[]; total: number };
    },
  });

  /* ---------- mutations ---------- */

  const analyzeMut = useMutation({
    mutationFn: async (targetUrl: string) => {
      const r = await fetch("/api/seo/meta-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      return j.data as MetaAnalysis;
    },
    onSuccess: (data) => {
      setUrlAnalysis(data);
      setShowUrlDialog(true);
    },
  });

  /* ---------- derived ---------- */

  const analyzed = useMemo(() => {
    if (!productsData?.products) return [];
    return productsData.products.map(analyzeProductMeta);
  }, [productsData]);

  const filtered = useMemo(() => {
    let result = analyzed;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.productName.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.category?.toLowerCase().includes(q))
      );
    }
    if (filterStatus !== "all") {
      result = result.filter(p => p.titleStatus === filterStatus || p.descriptionStatus === filterStatus);
    }
    return result;
  }, [analyzed, search, filterStatus]);

  const stats = useMemo(() => {
    const total = analyzed.length;
    const titleOk = analyzed.filter(p => p.titleStatus === "ok").length;
    const descOk = analyzed.filter(p => p.descriptionStatus === "ok").length;
    const issues = analyzed.filter(p => p.titleStatus !== "ok" || p.descriptionStatus !== "ok").length;
    const withKeywords = analyzed.filter(p => p.hasKeywords).length;
    return { total, titleOk, descOk, issues, withKeywords };
  }, [analyzed]);

  /* ---------- render ---------- */

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Meta tagy</h1>
            <p className="text-muted-foreground">Analyza a optimalizace meta tagu produktu</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const defaultUrl = "https://www.qsport.cz";
                const targetUrl = prompt("Zadejte URL pro analyzu meta tagu:", defaultUrl);
                if (targetUrl) analyzeMut.mutate(targetUrl);
              }}
              disabled={analyzeMut.isPending}
            >
              {analyzeMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
              Analyzovat URL
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Celkem produktu"
            value={stats.total}
            icon={Package}
            description="Analyzovano ze Shoptet"
          />
          <MetricCard
            title="Title v poradku"
            value={`${stats.titleOk}/${stats.total}`}
            icon={CheckCircle2}
            description={`${stats.total > 0 ? Math.round((stats.titleOk / stats.total) * 100) : 0}% optimalizovano`}
            trend={stats.titleOk === stats.total ? "up" : "neutral"}
          />
          <MetricCard
            title="Description v poradku"
            value={`${stats.descOk}/${stats.total}`}
            icon={FileText}
            description={`${stats.total > 0 ? Math.round((stats.descOk / stats.total) * 100) : 0}% optimalizovano`}
            trend={stats.descOk === stats.total ? "up" : "neutral"}
          />
          <MetricCard
            title="Produkty s problemy"
            value={stats.issues}
            icon={AlertTriangle}
            description="Vyzaduji pozornost"
            trend={stats.issues === 0 ? "up" : "down"}
          />
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Hledat podle nazvu, slugu nebo kategorie..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrovat podle stavu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vsechny stavy</SelectItem>
                  <SelectItem value="ok">V poradku</SelectItem>
                  <SelectItem value="short">Prilis kratke</SelectItem>
                  <SelectItem value="long">Prilis dlouhe</SelectItem>
                  <SelectItem value="missing">Chybejici</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        {isLoading ? (
          <div className="flex items-center gap-2 py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Nacitam produkty...</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Zadne produkty"
            description={search || filterStatus !== "all"
              ? "Zadne produkty neodpovidaji vasemu filtru. Zkuste upravit vyhledavani."
              : "Zatim nejsou synchronizovany zadne produkty ze Shoptet."
            }
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Analyza meta tagu ({filtered.length} produktu)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px]"></TableHead>
                    <TableHead>Produkt</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead className="text-center">Title</TableHead>
                    <TableHead className="text-center">Znaky</TableHead>
                    <TableHead className="text-center">Description</TableHead>
                    <TableHead className="text-center">Znaky</TableHead>
                    <TableHead className="text-center">Klicova slova</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(item => (
                    <>
                      <TableRow
                        key={item.productId}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => setExpandedId(expandedId === item.productId ? null : item.productId)}
                      >
                        <TableCell>
                          {expandedId === item.productId ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium max-w-[250px] truncate">{item.productName}</div>
                          <span className="text-xs text-muted-foreground">{item.slug}</span>
                        </TableCell>
                        <TableCell>
                          {item.category ? (
                            <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(item.titleStatus)}</TableCell>
                        <TableCell className="text-center">
                          <span className={`text-sm font-mono ${
                            item.titleStatus === "ok" ? "text-green-600" :
                            item.titleStatus === "missing" ? "text-red-600" : "text-yellow-600"
                          }`}>
                            {item.titleLength}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(item.descriptionStatus)}</TableCell>
                        <TableCell className="text-center">
                          <span className={`text-sm font-mono ${
                            item.descriptionStatus === "ok" ? "text-green-600" :
                            item.descriptionStatus === "missing" ? "text-red-600" : "text-yellow-600"
                          }`}>
                            {item.descriptionLength}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.hasKeywords ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Expanded suggestions */}
                      {expandedId === item.productId && (
                        <TableRow key={`${item.productId}-detail`}>
                          <TableCell colSpan={8} className="bg-muted/30 p-4">
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Title tag</h4>
                                  <p className="text-sm bg-background p-2 rounded border">
                                    {item.titleText || <span className="text-muted-foreground italic">Prazdny</span>}
                                  </p>
                                  <span className="text-xs text-muted-foreground">{item.titleLength}/60 znaku (doporuceno 30-60)</span>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                                    <div
                                      className={`h-1.5 rounded-full ${
                                        item.titleStatus === "ok" ? "bg-green-500" :
                                        item.titleStatus === "long" ? "bg-orange-500" :
                                        item.titleStatus === "short" ? "bg-yellow-500" : "bg-red-500"
                                      }`}
                                      style={{ width: `${Math.min(100, (item.titleLength / 60) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Meta description</h4>
                                  <p className="text-sm bg-background p-2 rounded border">
                                    {item.descriptionText ? item.descriptionText.substring(0, 200) : <span className="text-muted-foreground italic">Prazdny</span>}
                                    {item.descriptionText && item.descriptionText.length > 200 && "..."}
                                  </p>
                                  <span className="text-xs text-muted-foreground">{item.descriptionLength}/160 znaku (doporuceno 120-160)</span>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                                    <div
                                      className={`h-1.5 rounded-full ${
                                        item.descriptionStatus === "ok" ? "bg-green-500" :
                                        item.descriptionStatus === "long" ? "bg-orange-500" :
                                        item.descriptionStatus === "short" ? "bg-yellow-500" : "bg-red-500"
                                      }`}
                                      style={{ width: `${Math.min(100, (item.descriptionLength / 160) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Suggestions */}
                              {item.suggestions.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                                    Doporuceni pro zlepseni
                                  </h4>
                                  <ul className="space-y-1">
                                    {item.suggestions.map((s, i) => (
                                      <li key={i} className="flex items-start gap-2 text-sm">
                                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 mt-0.5 shrink-0" />
                                        {s}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {item.suggestions.length === 0 && (
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Vsechny meta tagy jsou v poradku.
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>

              {/* Summary bar */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-muted-foreground">
                <span>Zobrazeno {filtered.length} z {analyzed.length} produktu</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" /> {analyzed.filter(p => p.titleStatus === "ok" && p.descriptionStatus === "ok").length} bez problemu</span>
                  <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-yellow-600" /> {analyzed.filter(p => p.titleStatus !== "ok" || p.descriptionStatus !== "ok").length} k optimalizaci</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* URL Analysis Dialog */}
        {showUrlDialog && urlAnalysis && (
          <Dialog open onOpenChange={() => setShowUrlDialog(false)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Analyza meta tagu
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">{urlAnalysis.url}</div>

                {/* Title */}
                <div className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">Title</span>
                    {urlAnalysis.titleOk ? (
                      <Badge className="bg-green-100 text-green-800 border-0"><CheckCircle2 className="h-3 w-3 mr-1" />OK</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 border-0"><AlertTriangle className="h-3 w-3 mr-1" />Upravit</Badge>
                    )}
                  </div>
                  <p className="text-sm">{urlAnalysis.title || <span className="italic text-muted-foreground">Chybi</span>}</p>
                  <span className="text-xs text-muted-foreground">{urlAnalysis.titleLength} znaku</span>
                </div>

                {/* Description */}
                <div className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">Meta description</span>
                    {urlAnalysis.descriptionOk ? (
                      <Badge className="bg-green-100 text-green-800 border-0"><CheckCircle2 className="h-3 w-3 mr-1" />OK</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 border-0"><AlertTriangle className="h-3 w-3 mr-1" />Upravit</Badge>
                    )}
                  </div>
                  <p className="text-sm">{urlAnalysis.description || <span className="italic text-muted-foreground">Chybi</span>}</p>
                  <span className="text-xs text-muted-foreground">{urlAnalysis.descriptionLength} znaku</span>
                </div>

                {/* Open Graph */}
                <div className="p-3 rounded-lg border">
                  <span className="font-medium text-sm">Open Graph tagy</span>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">og:title:</div>
                    <div className="truncate">{urlAnalysis.ogTitle || <span className="text-red-500">Chybi</span>}</div>
                    <div className="text-muted-foreground">og:description:</div>
                    <div className="truncate">{urlAnalysis.ogDescription || <span className="text-red-500">Chybi</span>}</div>
                    <div className="text-muted-foreground">og:image:</div>
                    <div className="truncate">{urlAnalysis.ogImage || <span className="text-red-500">Chybi</span>}</div>
                    <div className="text-muted-foreground">twitter:card:</div>
                    <div>{urlAnalysis.twitterCard || <span className="text-red-500">Chybi</span>}</div>
                    <div className="text-muted-foreground">robots:</div>
                    <div>{urlAnalysis.robots || <span className="text-muted-foreground">Nenastaveno</span>}</div>
                  </div>
                </div>

                {/* All meta tags */}
                {Object.keys(urlAnalysis.allMetaTags).length > 0 && (
                  <div className="p-3 rounded-lg border">
                    <span className="font-medium text-sm">Vsechny meta tagy ({Object.keys(urlAnalysis.allMetaTags).length})</span>
                    <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                      {Object.entries(urlAnalysis.allMetaTags).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-2 text-xs">
                          <Badge variant="outline" className="shrink-0 text-xs">{key}</Badge>
                          <span className="text-muted-foreground truncate">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setShowUrlDialog(false)}>Zavrit</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}

