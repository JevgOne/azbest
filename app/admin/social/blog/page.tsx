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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MetricCard } from "@/components/admin/MetricCard";
import { EmptyState } from "@/components/admin/EmptyState";
import {
  PenTool, Plus, Search, Loader2, Trash2, Pencil, Eye, EyeOff,
  FileText, BarChart3, Send, Archive, Filter,
} from "lucide-react";

interface BlogPost {
  post_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  category: string | null;
  tags: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_score: number | null;
  status: string;
  author_email: string | null;
  published_at: number | null;
  created_at: number;
  updated_at: number;
}

interface PostFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string;
  seoTitle: string;
  seoDescription: string;
  status: string;
  featuredImage: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Koncept",
  published: "Publikovano",
  archived: "Archivovano",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const CATEGORIES = [
  "Sport", "Vybaveni", "Recenze", "Navody", "Novinky", "Tipy", "Akce",
];

const EMPTY_FORM: PostFormData = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  category: "",
  tags: "",
  seoTitle: "",
  seoDescription: "",
  status: "draft",
  featuredImage: "",
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDate(ts: number): string {
  if (!ts) return "\u2014";
  return new Date(ts * 1000).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseTags(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.split(",").map((t) => t.trim()).filter(Boolean);
  }
}

function computeSeoScore(post: PostFormData): number {
  let score = 0;
  if (post.seoTitle && post.seoTitle.length >= 30 && post.seoTitle.length <= 60) score += 25;
  else if (post.seoTitle) score += 10;
  if (post.seoDescription && post.seoDescription.length >= 120 && post.seoDescription.length <= 160) score += 25;
  else if (post.seoDescription) score += 10;
  if (post.slug) score += 15;
  if (post.excerpt) score += 15;
  if (post.content && post.content.length > 300) score += 20;
  else if (post.content) score += 10;
  return Math.min(score, 100);
}

function SeoScoreBadge({ score }: { score: number | null }) {
  const s = score ?? 0;
  const color =
    s >= 80
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      : s >= 50
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  return (
    <Badge variant="outline" className={`${color} border-0 font-mono`}>
      {s}/100
    </Badge>
  );
}

export default function BlogPage() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<PostFormData>(EMPTY_FORM);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setSearchDebounced(value), 400);
    setDebounceTimer(timer);
  };

  // Fetch posts
  const { data, isLoading } = useQuery({
    queryKey: ["blog-posts", filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", "200");
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/blog?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { posts: BlogPost[]; total: number };
    },
  });

  const allPosts = data?.posts || [];

  // Client-side search filter
  const filteredPosts = useMemo(() => {
    if (!searchDebounced) return allPosts;
    const q = searchDebounced.toLowerCase();
    return allPosts.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    );
  }, [allPosts, searchDebounced]);

  // Metrics
  const metrics = useMemo(() => {
    const total = allPosts.length;
    const published = allPosts.filter((p) => p.status === "published").length;
    const drafts = allPosts.filter((p) => p.status === "draft").length;
    const scores = allPosts
      .map((p) => Number(p.seo_score) || 0)
      .filter((s) => s > 0);
    const avgSeo =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
    return { total, published, drafts, avgSeo };
  }, [allPosts]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (postData: PostFormData) => {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: postData.title,
          slug: postData.slug,
          content: postData.content,
          excerpt: postData.excerpt || null,
          featuredImage: postData.featuredImage || null,
          status: postData.status,
          seoTitle: postData.seoTitle || postData.title,
          seoDescription: postData.seoDescription || postData.excerpt || null,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      closeDialog();
    },
  });

  const openCreateDialog = () => {
    setEditingPost(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (post: BlogPost) => {
    setEditingPost(post);
    const tags = parseTags(post.tags);
    setForm({
      title: post.title || "",
      slug: post.slug || "",
      content: post.content || "",
      excerpt: post.excerpt || "",
      category: post.category || "",
      tags: tags.join(", "),
      seoTitle: post.seo_title || "",
      seoDescription: post.seo_description || "",
      status: post.status || "draft",
      featuredImage: post.featured_image || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPost(null);
    setForm(EMPTY_FORM);
  };

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: !editingPost ? generateSlug(value) : prev.slug,
      seoTitle: !prev.seoTitle || prev.seoTitle === generateSlug(prev.title) ? value : prev.seoTitle,
    }));
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    saveMutation.mutate(form);
  };

  const handlePublish = async (post: BlogPost) => {
    try {
      await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          featuredImage: post.featured_image,
          status: "published",
          seoTitle: post.seo_title,
          seoDescription: post.seo_description,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    } catch {
      // Tichy chyba
    }
  };

  const handleUnpublish = async (post: BlogPost) => {
    try {
      await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          featuredImage: post.featured_image,
          status: "draft",
          seoTitle: post.seo_title,
          seoDescription: post.seo_description,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    } catch {
      // Tichy chyba
    }
  };

  const currentSeoScore = computeSeoScore(form);

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Blog</h1>
            <p className="text-muted-foreground">
              Sprava blogovych clanku pro qsport.cz
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Novy clanek
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Celkem clanku"
            value={metrics.total}
            icon={FileText}
            description="Vsechny blogove clanky"
          />
          <MetricCard
            title="Publikovano"
            value={metrics.published}
            icon={Send}
            trend={metrics.published > 0 ? "up" : "neutral"}
            change={metrics.total > 0 ? `${Math.round((metrics.published / metrics.total) * 100)}% z celku` : undefined}
          />
          <MetricCard
            title="Koncepty"
            value={metrics.drafts}
            icon={PenTool}
            description="Cekaji na publikaci"
          />
          <MetricCard
            title="Prumerne SEO skore"
            value={`${metrics.avgSeo}/100`}
            icon={BarChart3}
            trend={metrics.avgSeo >= 70 ? "up" : metrics.avgSeo >= 40 ? "neutral" : "down"}
            change={metrics.avgSeo >= 70 ? "Dobry vysledek" : "Prostor ke zlepseni"}
          />
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtry:</span>
              </div>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Hledat podle nazvu..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Stav" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vsechny stavy</SelectItem>
                  <SelectItem value="draft">Koncepty</SelectItem>
                  <SelectItem value="published">Publikovane</SelectItem>
                  <SelectItem value="archived">Archivovane</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Posts Table */}
        {isLoading ? (
          <div className="flex items-center gap-2 py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Nacitani clanku...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            icon={PenTool}
            title="Zadne clanky"
            description="Zatim nebyly vytvoreny zadne blogove clanky. Vytvorte prvni clanek kliknutim na tlacitko vyse."
            action={
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Vytvorit clanek
              </Button>
            }
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Clanky ({filteredPosts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazev</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead>SEO skore</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.post_id}>
                      <TableCell>
                        <div className="font-medium max-w-[250px] truncate">
                          {post.title}
                        </div>
                        {post.author_email && (
                          <span className="text-xs text-muted-foreground">
                            {post.author_email}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground font-mono max-w-[150px] truncate block">
                          {post.slug || "\u2014"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {post.category ? (
                          <Badge variant="outline">{post.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">\u2014</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${STATUS_COLORS[post.status] || ""} border-0`}
                        >
                          {STATUS_LABELS[post.status] || post.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <SeoScoreBadge score={post.seo_score} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(post.published_at || post.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Upravit"
                            onClick={() => openEditDialog(post)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {post.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Publikovat"
                              onClick={() => handlePublish(post)}
                            >
                              <Send className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {post.status === "published" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Zrusit publikaci"
                              onClick={() => handleUnpublish(post)}
                            >
                              <EyeOff className="h-4 w-4 text-yellow-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPost ? "Upravit clanek" : "Novy clanek"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <Label htmlFor="post-title">Nazev clanku *</Label>
                <Input
                  id="post-title"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Zadejte nazev clanku..."
                />
              </div>

              {/* Slug */}
              <div>
                <Label htmlFor="post-slug">Slug (URL)</Label>
                <Input
                  id="post-slug"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="url-clanku"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Automaticky generovano z nazvu
                </p>
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="post-content">Obsah *</Label>
                <Textarea
                  id="post-content"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Napiste obsah clanku..."
                  rows={8}
                />
              </div>

              {/* Excerpt */}
              <div>
                <Label htmlFor="post-excerpt">Strucny popis</Label>
                <Textarea
                  id="post-excerpt"
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  placeholder="Kratky popis clanku pro nahled..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <Label>Kategorie</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte kategorii" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <Label>Stav</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Stav" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Koncept</SelectItem>
                      <SelectItem value="published">Publikovano</SelectItem>
                      <SelectItem value="archived">Archivovano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="post-tags">Stitky (oddelene carkou)</Label>
                <Input
                  id="post-tags"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="sport, vybaveni, recenze..."
                />
              </div>

              {/* Featured Image */}
              <div>
                <Label htmlFor="post-image">URL hlavniho obrazku</Label>
                <Input
                  id="post-image"
                  value={form.featuredImage}
                  onChange={(e) => setForm((f) => ({ ...f, featuredImage: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              {/* SEO Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    SEO optimalizace
                  </h4>
                  <SeoScoreBadge score={currentSeoScore} />
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="seo-title">SEO titulek</Label>
                    <Input
                      id="seo-title"
                      value={form.seoTitle}
                      onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
                      placeholder="Titulek pro vyhledavace (30-60 znaku)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {form.seoTitle.length}/60 znaku
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="seo-desc">SEO popis</Label>
                    <Textarea
                      id="seo-desc"
                      value={form.seoDescription}
                      onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
                      placeholder="Meta popis pro vyhledavace (120-160 znaku)"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {form.seoDescription.length}/160 znaku
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={closeDialog}>
                  Zrusit
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending || !form.title.trim() || !form.content.trim()}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : editingPost ? (
                    <Pencil className="h-4 w-4 mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {editingPost ? "Ulozit zmeny" : "Vytvorit clanek"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
