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
  Palette, Plus, Loader2, Image as ImageIcon, FileText,
  Upload, Eye, Filter, Download, Copy, Check,
  Type, Video, Droplets, BookOpen, Grid3X3,
} from "lucide-react";

interface BrandAsset {
  id: number;
  name: string;
  type: string;
  url: string;
  description: string | null;
  metadata: string | null;
  tags: string | null;
  uploaded_by: string | null;
  created_at: number;
}

interface BrandGuide {
  brand: string;
  tagline: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
  tone: string;
  logoUsage: string;
}

interface AssetFormData {
  name: string;
  type: string;
  url: string;
  description: string;
}

const ASSET_TYPES = [
  { value: "logo", label: "Logo", icon: Grid3X3 },
  { value: "icon", label: "Ikona", icon: Grid3X3 },
  { value: "banner", label: "Banner", icon: ImageIcon },
  { value: "photo", label: "Fotografie", icon: ImageIcon },
  { value: "video", label: "Video", icon: Video },
  { value: "font", label: "Font", icon: Type },
  { value: "color", label: "Barva", icon: Droplets },
  { value: "guideline", label: "Pravidla", icon: BookOpen },
];

const TYPE_LABELS: Record<string, string> = {
  logo: "Logo",
  icon: "Ikona",
  banner: "Banner",
  photo: "Fotografie",
  video: "Video",
  font: "Font",
  color: "Barva",
  guideline: "Pravidla",
};

const TYPE_COLORS: Record<string, string> = {
  logo: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  icon: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  banner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  photo: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  video: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  font: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  guideline: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const EMPTY_FORM: AssetFormData = {
  name: "",
  type: "",
  url: "",
  description: "",
};

function formatDate(ts: number): string {
  if (!ts) return "\u2014";
  return new Date(ts * 1000).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseMetadata(value: string | null): Record<string, any> {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function isImageType(type: string): boolean {
  return ["logo", "icon", "banner", "photo"].includes(type);
}

export default function BrandingPage() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();

  const [filterType, setFilterType] = useState<string>("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [detailAsset, setDetailAsset] = useState<BrandAsset | null>(null);
  const [form, setForm] = useState<AssetFormData>(EMPTY_FORM);
  const [copied, setCopied] = useState(false);

  // Fetch assets
  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ["brand-assets", filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType !== "all") params.set("type", filterType);
      const res = await fetch(`/api/branding/assets?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as BrandAsset[];
    },
  });

  // Fetch brand guide
  const { data: guideData } = useQuery({
    queryKey: ["brand-guide"],
    queryFn: async () => {
      const res = await fetch("/api/branding/guide");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as BrandGuide;
    },
  });

  const assets = assetsData || [];
  const guide = guideData;

  // Metrics
  const metrics = useMemo(() => {
    const total = assets.length;
    const byType: Record<string, number> = {};
    assets.forEach((a) => {
      byType[a.type] = (byType[a.type] || 0) + 1;
    });
    const logoCount = byType["logo"] || 0;
    const photoCount = byType["photo"] || 0;
    const bannerCount = byType["banner"] || 0;
    return { total, logoCount, photoCount, bannerCount, byType };
  }, [assets]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: AssetFormData) => {
      const res = await fetch("/api/branding/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          url: data.url,
          description: data.description || null,
          metadata: {},
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-assets"] });
      setUploadOpen(false);
      setForm(EMPTY_FORM);
    },
  });

  const handleUpload = () => {
    if (!form.name.trim() || !form.type || !form.url.trim()) return;
    uploadMutation.mutate(form);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Branding</h1>
            <p className="text-muted-foreground">
              Vizualni identita a knihovna assetu QSPORT
            </p>
          </div>
          <Button onClick={() => { setForm(EMPTY_FORM); setUploadOpen(true); }}>
            <Upload className="h-4 w-4 mr-2" />
            Nahrat asset
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Celkem assetu"
            value={metrics.total}
            icon={Palette}
            description="Vsechny brandove materialy"
          />
          <MetricCard
            title="Loga"
            value={metrics.logoCount}
            icon={Grid3X3}
            description={`Ikony: ${metrics.byType["icon"] || 0}`}
          />
          <MetricCard
            title="Fotografie"
            value={metrics.photoCount}
            icon={ImageIcon}
            description={`Bannery: ${metrics.bannerCount}`}
          />
          <MetricCard
            title="Ostatni"
            value={(metrics.byType["font"] || 0) + (metrics.byType["color"] || 0) + (metrics.byType["video"] || 0)}
            icon={FileText}
            description={`Fonty: ${metrics.byType["font"] || 0}, Barvy: ${metrics.byType["color"] || 0}`}
          />
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtr podle typu:</span>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Typ assetu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vsechny typy</SelectItem>
                  {ASSET_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Asset Gallery */}
        {assetsLoading ? (
          <div className="flex items-center gap-2 py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Nacitani assetu...</span>
          </div>
        ) : assets.length === 0 ? (
          <EmptyState
            icon={Palette}
            title="Zadne assety"
            description="Zatim nebyly nahrany zadne brandove materialy. Nahrajte prvni asset kliknutim na tlacitko vyse."
            action={
              <Button onClick={() => { setForm(EMPTY_FORM); setUploadOpen(true); }}>
                <Upload className="h-4 w-4 mr-2" />
                Nahrat asset
              </Button>
            }
          />
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Assety ({assets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="group border rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    onClick={() => setDetailAsset(asset)}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-square bg-muted/50 flex items-center justify-center overflow-hidden">
                      {isImageType(asset.type) && asset.url ? (
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : asset.type === "color" ? (
                        <div
                          className="w-full h-full"
                          style={{ backgroundColor: asset.url || "#ccc" }}
                        />
                      ) : asset.type === "font" ? (
                        <Type className="h-12 w-12 text-muted-foreground" />
                      ) : asset.type === "video" ? (
                        <Video className="h-12 w-12 text-muted-foreground" />
                      ) : (
                        <FileText className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">{asset.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge
                          variant="outline"
                          className={`${TYPE_COLORS[asset.type] || ""} border-0 text-xs`}
                        >
                          {TYPE_LABELS[asset.type] || asset.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(asset.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Brand Guide Section */}
        {guide && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Brandovy pruvodce
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Brand Info */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1">Znacka</h4>
                    <p className="text-lg font-bold">{guide.brand}</p>
                    {guide.tagline && (
                      <p className="text-sm text-muted-foreground italic">
                        &ldquo;{guide.tagline}&rdquo;
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Ton komunikace</h4>
                    <p className="text-sm text-muted-foreground">{guide.tone}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Pouziti loga</h4>
                    <p className="text-sm text-muted-foreground">{guide.logoUsage}</p>
                  </div>
                  {guide.fonts && (
                    <div>
                      <h4 className="font-semibold mb-2">Fonty</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(guide.fonts).map(([key, val]) => (
                          <div key={key}>
                            <span className="text-muted-foreground capitalize">{key}: </span>
                            <span className="font-medium">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Colors */}
                {guide.colors && (
                  <div>
                    <h4 className="font-semibold mb-3">Brandove barvy</h4>
                    <div className="space-y-3">
                      {Object.entries(guide.colors).map(([name, hex]) => (
                        <div key={name} className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0"
                            style={{ backgroundColor: hex }}
                          />
                          <div>
                            <p className="text-sm font-medium capitalize">{name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{hex}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto"
                            onClick={() => handleCopyUrl(hex)}
                          >
                            {copied ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Dialog */}
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nahrat novy asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="asset-name">Nazev *</Label>
                <Input
                  id="asset-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nazev assetu..."
                />
              </div>
              <div>
                <Label>Typ *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte typ assetu" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="asset-url">URL souboru *</Label>
                <Input
                  id="asset-url"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL adresa souboru nebo barvy (pro typ Barva zadejte hex kod)
                </p>
              </div>
              <div>
                <Label htmlFor="asset-desc">Popis</Label>
                <Textarea
                  id="asset-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Volitelny popis assetu..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setUploadOpen(false)}>
                  Zrusit
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending || !form.name.trim() || !form.type || !form.url.trim()}
                >
                  {uploadMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Nahrat
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Asset Detail Dialog */}
        {detailAsset && (
          <Dialog open onOpenChange={() => setDetailAsset(null)}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{detailAsset.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Preview */}
                {isImageType(detailAsset.type) && detailAsset.url ? (
                  <div className="aspect-video bg-muted/50 rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={detailAsset.url}
                      alt={detailAsset.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : detailAsset.type === "color" ? (
                  <div
                    className="h-32 rounded-lg border"
                    style={{ backgroundColor: detailAsset.url || "#ccc" }}
                  />
                ) : null}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Typ:</span>
                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className={`${TYPE_COLORS[detailAsset.type] || ""} border-0`}
                      >
                        {TYPE_LABELS[detailAsset.type] || detailAsset.type}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vytvoreno:</span>
                    <p className="font-medium mt-1">
                      {formatDate(detailAsset.created_at)}
                    </p>
                  </div>
                  {detailAsset.uploaded_by && (
                    <div>
                      <span className="text-muted-foreground">Nahral:</span>
                      <p className="font-medium mt-1">{detailAsset.uploaded_by}</p>
                    </div>
                  )}
                  {detailAsset.description && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Popis:</span>
                      <p className="mt-1">{detailAsset.description}</p>
                    </div>
                  )}
                  {(() => {
                    const meta = parseMetadata(detailAsset.metadata);
                    if (meta.dimensions) {
                      return (
                        <div>
                          <span className="text-muted-foreground">Rozmery:</span>
                          <p className="font-medium mt-1">{meta.dimensions}</p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {(() => {
                    const meta = parseMetadata(detailAsset.metadata);
                    if (meta.fileSize) {
                      return (
                        <div>
                          <span className="text-muted-foreground">Velikost:</span>
                          <p className="font-medium mt-1">{meta.fileSize}</p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* URL */}
                <div>
                  <span className="text-sm text-muted-foreground">URL:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={detailAsset.url}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyUrl(detailAsset.url)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDetailAsset(null)}>
                    Zavrit
                  </Button>
                  {detailAsset.url && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(detailAsset.url, "_blank")}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Otevrit
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
