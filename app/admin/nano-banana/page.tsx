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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MetricCard } from "@/components/admin/MetricCard";
import { EmptyState } from "@/components/admin/EmptyState";
import {
  Sparkles, Loader2, Image as ImageIcon, Filter, Copy, Check,
  Download, Eye, Wand2, Zap, ShoppingBag, Share2, Megaphone,
  LayoutGrid, ExternalLink,
} from "lucide-react";

interface GeneratedImage {
  id: number;
  prediction_id: string;
  prompt: string;
  style: string | null;
  width: number;
  height: number;
  image_url: string | null;
  status: string;
  category: string | null;
  tags: string | null;
  created_by: string | null;
  created_at: number;
}

interface PromptTemplate {
  id: number;
  name: string;
  prompt: string;
  category: string;
}

const STYLES = [
  { value: "", label: "Zadny styl" },
  { value: "photorealistic", label: "Fotorealisticky" },
  { value: "digital art", label: "Digitalni umeni" },
  { value: "minimalist", label: "Minimalisticky" },
  { value: "watercolor", label: "Akvarel" },
  { value: "3D render", label: "3D render" },
  { value: "flat design", label: "Plochy design" },
  { value: "vintage", label: "Vintage" },
  { value: "neon", label: "Neonovy" },
];

const DIMENSIONS = [
  { value: "1024x1024", label: "1024 x 1024 (ctverec)", width: 1024, height: 1024 },
  { value: "1024x768", label: "1024 x 768 (na sirku)", width: 1024, height: 768 },
  { value: "768x1024", label: "768 x 1024 (na vysku)", width: 768, height: 1024 },
  { value: "1280x720", label: "1280 x 720 (16:9)", width: 1280, height: 720 },
  { value: "1080x1080", label: "1080 x 1080 (Instagram)", width: 1080, height: 1080 },
  { value: "1200x628", label: "1200 x 628 (Facebook)", width: 1200, height: 628 },
];

const CATEGORIES = [
  { value: "all", label: "Vsechny kategorie" },
  { value: "product", label: "Produktove" },
  { value: "banner", label: "Bannery" },
  { value: "social", label: "Socialni site" },
  { value: "brand", label: "Brandove" },
];

const CATEGORY_LABELS: Record<string, string> = {
  product: "Produkt",
  banner: "Banner",
  social: "Socialni",
  brand: "Brand",
  promotion: "Promo",
  blog: "Blog",
  email: "E-mail",
};

const CATEGORY_COLORS: Record<string, string> = {
  product: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  banner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  social: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  brand: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  promotion: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  blog: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  email: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
};

function formatDate(ts: number): string {
  if (!ts) return "\u2014";
  return new Date(ts * 1000).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NanoBananaPage() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();

  // Generator state
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [dimensions, setDimensions] = useState("1024x1024");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [detailImage, setDetailImage] = useState<GeneratedImage | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch gallery
  const { data: galleryData, isLoading: galleryLoading } = useQuery({
    queryKey: ["nano-banana-gallery"],
    queryFn: async () => {
      const res = await fetch("/api/nano-banana/gallery?limit=100");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { images: GeneratedImage[]; total: number };
    },
  });

  // Fetch templates
  const { data: templatesData } = useQuery({
    queryKey: ["nano-banana-templates"],
    queryFn: async () => {
      const res = await fetch("/api/nano-banana/templates");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as PromptTemplate[];
    },
  });

  const allImages = galleryData?.images || [];
  const templates = templatesData || [];

  // Client-side category filter
  const filteredImages = useMemo(() => {
    if (filterCategory === "all") return allImages;
    return allImages.filter((img) => img.category === filterCategory);
  }, [allImages, filterCategory]);

  // Metrics
  const metrics = useMemo(() => {
    const total = allImages.length;
    const byCategory: Record<string, number> = {};
    allImages.forEach((img) => {
      const cat = img.category || "ostatni";
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });
    return { total, byCategory };
  }, [allImages]);

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const dim = DIMENSIONS.find((d) => d.value === dimensions) || DIMENSIONS[0];
      const res = await fetch("/api/nano-banana/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          style: style || undefined,
          width: dim.width,
          height: dim.height,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nano-banana-gallery"] });
      setPrompt("");
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    generateMutation.mutate();
  };

  const applyTemplate = (template: PromptTemplate) => {
    setPrompt(template.prompt);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name || "generated-image.png";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const templateIcon = (category: string) => {
    switch (category) {
      case "product": return ShoppingBag;
      case "social": return Share2;
      case "promotion": return Megaphone;
      case "blog": return LayoutGrid;
      default: return Sparkles;
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Nano Banana Pro</h1>
            <p className="text-muted-foreground">
              AI generovani grafiky pro marketing
            </p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Celkem vygenerovano"
            value={metrics.total}
            icon={Sparkles}
            description="Vsechny generovane obrazky"
          />
          <MetricCard
            title="Produktove"
            value={metrics.byCategory["product"] || 0}
            icon={ShoppingBag}
            description="Produktove fotografie"
          />
          <MetricCard
            title="Bannery"
            value={metrics.byCategory["banner"] || 0}
            icon={ImageIcon}
            description="Reklamni bannery"
          />
          <MetricCard
            title="Socialni site"
            value={metrics.byCategory["social"] || 0}
            icon={Share2}
            description={`Brand: ${metrics.byCategory["brand"] || 0}`}
          />
        </div>

        {/* AI Generator */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              AI Generator obrazku
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Prompt */}
              <div>
                <Label htmlFor="gen-prompt">Prompt (popis obrazku) *</Label>
                <Textarea
                  id="gen-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Popiste obrazek, ktery chcete vygenerovat..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Style */}
                <div>
                  <Label>Styl</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte styl" />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLES.map((s) => (
                        <SelectItem key={s.value} value={s.value || "none"}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dimensions */}
                <div>
                  <Label>Rozmery</Label>
                  <Select value={dimensions} onValueChange={setDimensions}>
                    <SelectTrigger>
                      <SelectValue placeholder="Rozmery" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIMENSIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Generate Button */}
                <div className="flex items-end">
                  <Button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending || !prompt.trim()}
                    className="w-full"
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {generateMutation.isPending ? "Generuji..." : "Generovat obrazek"}
                  </Button>
                </div>
              </div>

              {/* Success/Error feedback */}
              {generateMutation.isSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Obrazek byl uspesne odeslany ke generovani. Vysledek se objevi v galerii.
                  </p>
                </div>
              )}
              {generateMutation.isError && (
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Chyba: {(generateMutation.error as Error).message}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Templates */}
        {templates.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Rychle sablony
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {templates.map((template) => {
                  const TemplateIcon = templateIcon(template.category);
                  return (
                    <div
                      key={template.id}
                      className="border rounded-lg p-4 hover:ring-2 hover:ring-primary cursor-pointer transition-all"
                      onClick={() => applyTemplate(template)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <TemplateIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{template.name}</span>
                        <Badge
                          variant="outline"
                          className={`${CATEGORY_COLORS[template.category] || ""} border-0 text-xs ml-auto`}
                        >
                          {CATEGORY_LABELS[template.category] || template.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.prompt}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gallery Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtrovat galerii:</span>
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Image Gallery */}
        {galleryLoading ? (
          <div className="flex items-center gap-2 py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Nacitani galerie...</span>
          </div>
        ) : filteredImages.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Zadne obrazky"
            description="Zatim nebyly vygenerovany zadne obrazky. Pouzijte AI generator vyse pro vytvoreni prvniho obrazku."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Galerie ({filteredImages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredImages.map((image) => (
                  <div
                    key={image.id}
                    className="group border rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    onClick={() => setDetailImage(image)}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-square bg-muted/50 flex items-center justify-center overflow-hidden">
                      {image.image_url ? (
                        <img
                          src={image.image_url}
                          alt={image.prompt?.substring(0, 50) || "Generovany obrazek"}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Generuje se...</span>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {image.prompt || "\u2014"}
                      </p>
                      <div className="flex items-center justify-between">
                        {image.category ? (
                          <Badge
                            variant="outline"
                            className={`${CATEGORY_COLORS[image.category] || ""} border-0 text-xs`}
                          >
                            {CATEGORY_LABELS[image.category] || image.category}
                          </Badge>
                        ) : (
                          <span />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {image.width}x{image.height}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Detail Dialog */}
        {detailImage && (
          <Dialog open onOpenChange={() => setDetailImage(null)}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Detail obrazku</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Full size preview */}
                {detailImage.image_url ? (
                  <div className="bg-muted/50 rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={detailImage.image_url}
                      alt={detailImage.prompt?.substring(0, 50) || "Generovany obrazek"}
                      className="max-w-full max-h-[500px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-muted/50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Obrazek se generuje...</p>
                    </div>
                  </div>
                )}

                {/* Prompt */}
                <div>
                  <span className="text-sm font-medium">Prompt:</span>
                  <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-lg">
                    {detailImage.prompt}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {detailImage.style && (
                    <div>
                      <span className="text-muted-foreground">Styl:</span>
                      <p className="font-medium mt-1">{detailImage.style}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Rozmery:</span>
                    <p className="font-medium mt-1">{detailImage.width} x {detailImage.height}</p>
                  </div>
                  {detailImage.category && (
                    <div>
                      <span className="text-muted-foreground">Kategorie:</span>
                      <div className="mt-1">
                        <Badge
                          variant="outline"
                          className={`${CATEGORY_COLORS[detailImage.category] || ""} border-0`}
                        >
                          {CATEGORY_LABELS[detailImage.category] || detailImage.category}
                        </Badge>
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Stav:</span>
                    <p className="font-medium mt-1">{detailImage.status || "\u2014"}</p>
                  </div>
                  {detailImage.created_by && (
                    <div>
                      <span className="text-muted-foreground">Vytvoril:</span>
                      <p className="font-medium mt-1">{detailImage.created_by}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Vytvoreno:</span>
                    <p className="font-medium mt-1">{formatDate(detailImage.created_at)}</p>
                  </div>
                </div>

                {/* URL + Actions */}
                {detailImage.image_url && (
                  <>
                    <div>
                      <span className="text-sm text-muted-foreground">URL:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={detailImage.image_url}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyUrl(detailImage.image_url!)}
                        >
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setDetailImage(null)}>
                        Zavrit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDownload(detailImage.image_url!, `nano-banana-${detailImage.id}.png`)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Stahnout
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open(detailImage.image_url!, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Otevrit
                      </Button>
                    </div>
                  </>
                )}
                {!detailImage.image_url && (
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setDetailImage(null)}>
                      Zavrit
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
