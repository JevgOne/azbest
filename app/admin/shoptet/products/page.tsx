"use client";

import { useState, useMemo } from "react";
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/admin/EmptyState";
import {
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye,
  EyeOff,
  ImageIcon,
  Tag,
} from "lucide-react";

interface Product {
  id: number;
  shoptet_id: string;
  name: string;
  slug: string;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  price: number;
  price_before_discount: number | null;
  currency: string;
  stock: number;
  ean: string | null;
  sku: string | null;
  weight: number | null;
  description: string | null;
  short_description: string | null;
  images: string | null;
  variants: string | null;
  parameters: string | null;
  visibility: string;
  created_at: number;
  updated_at: number;
  synced_at: number;
}

const PAGE_SIZE = 25;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp * 1000));
}

function parseJson(value: string | null): any[] {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function parseJsonObj(value: string | null): Record<string, any> {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export default function ShoptetProductsPage() {
  const { user } = useAdminAuth();
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [visibility, setVisibility] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Debounce search
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      setSearchDebounced(value);
      setPage(0);
    }, 400);
    setDebounceTimer(timer);
  };

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(page * PAGE_SIZE));
    if (searchDebounced) params.set("search", searchDebounced);
    if (category && category !== "all") params.set("category", category);
    if (visibility && visibility !== "all") params.set("visibility", visibility);
    return params.toString();
  }, [page, searchDebounced, category, visibility]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["shoptet-products", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/shoptet/products?${queryParams}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { products: Product[]; total: number };
    },
  });

  // Fetch all products once to extract unique categories
  const { data: allData } = useQuery({
    queryKey: ["shoptet-products-categories"],
    queryFn: async () => {
      const res = await fetch("/api/shoptet/products?limit=1000&offset=0");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { products: Product[]; total: number };
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(() => {
    if (!allData?.products) return [];
    const cats = new Set<string>();
    allData.products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [allData]);

  const products = data?.products || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Produkty</h1>
          <p className="text-muted-foreground">
            Přehled produktů synchronizovaných ze Shoptet ({total} celkem)
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Hledat podle názvu nebo značky..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={category} onValueChange={(v) => { setCategory(v); setPage(0); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny kategorie</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={visibility} onValueChange={(v) => { setVisibility(v); setPage(0); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Viditelnost" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vše</SelectItem>
                  <SelectItem value="visible">Viditelné</SelectItem>
                  <SelectItem value="hidden">Skryté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produkty
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Žádné produkty"
                description="Zatím nebyly synchronizovány žádné produkty ze Shoptet. Spusťte synchronizaci v sekci Synchronizace."
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30px]"></TableHead>
                      <TableHead>Název</TableHead>
                      <TableHead>Značka</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead className="text-right">Cena</TableHead>
                      <TableHead className="text-right">Sklad</TableHead>
                      <TableHead>Viditelnost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <>
                        <TableRow
                          key={product.id}
                          className="cursor-pointer"
                          onClick={() =>
                            setExpandedId(
                              expandedId === product.id ? null : product.id
                            )
                          }
                        >
                          <TableCell>
                            {expandedId === product.id ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium max-w-[300px] truncate">
                              {product.name}
                            </div>
                            {product.sku && (
                              <span className="text-xs text-muted-foreground">
                                SKU: {product.sku}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.brand || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>{product.category || "-"}</div>
                            {product.subcategory && (
                              <span className="text-xs text-muted-foreground">
                                {product.subcategory}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium">
                              {formatCurrency(product.price)}
                            </div>
                            {product.price_before_discount &&
                              product.price_before_discount > product.price && (
                                <div className="text-xs text-muted-foreground line-through">
                                  {formatCurrency(product.price_before_discount)}
                                </div>
                              )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                product.stock > 0 ? "secondary" : "destructive"
                              }
                            >
                              {product.stock > 0
                                ? `${product.stock} ks`
                                : "Vyprodáno"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {product.visibility === "visible" ? (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-0"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Viditelný
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-0"
                              >
                                <EyeOff className="h-3 w-3 mr-1" />
                                Skrytý
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Expanded detail row */}
                        {expandedId === product.id && (
                          <TableRow key={`${product.id}-detail`}>
                            <TableCell colSpan={7} className="bg-muted/30 p-4">
                              <ProductDetail product={product} />
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Zobrazeno {page * PAGE_SIZE + 1}–
                    {Math.min((page + 1) * PAGE_SIZE, total)} z {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Předchozí
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      {page + 1} / {totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(page + 1)}
                    >
                      Další
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function ProductDetail({ product }: { product: Product }) {
  const images = parseJson(product.images);
  const variants = parseJson(product.variants);
  const parameters = parseJsonObj(product.parameters);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left column: Info */}
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Detaily produktu</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Shoptet ID:</div>
            <div>{product.shoptet_id}</div>
            <div className="text-muted-foreground">Slug:</div>
            <div className="truncate">{product.slug || "-"}</div>
            <div className="text-muted-foreground">EAN:</div>
            <div>{product.ean || "-"}</div>
            <div className="text-muted-foreground">SKU:</div>
            <div>{product.sku || "-"}</div>
            <div className="text-muted-foreground">Hmotnost:</div>
            <div>{product.weight ? `${product.weight} kg` : "-"}</div>
            <div className="text-muted-foreground">Měna:</div>
            <div>{product.currency}</div>
            <div className="text-muted-foreground">Poslední sync:</div>
            <div>{formatDate(product.synced_at)}</div>
            <div className="text-muted-foreground">Vytvořeno:</div>
            <div>{formatDate(product.created_at)}</div>
          </div>
        </div>

        {product.short_description && (
          <div>
            <h4 className="font-semibold mb-1">Krátký popis</h4>
            <p className="text-sm text-muted-foreground">
              {product.short_description}
            </p>
          </div>
        )}

        {product.description && (
          <div>
            <h4 className="font-semibold mb-1">Popis</h4>
            <div
              className="text-sm text-muted-foreground max-h-32 overflow-y-auto prose prose-sm"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        {/* Parameters */}
        {Object.keys(parameters).length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-1">
              <Tag className="h-4 w-4" />
              Parametry
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(parameters).map(([key, value]) => (
                <Badge key={key} variant="outline" className="text-xs">
                  {key}: {String(value)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right column: Images & Variants */}
      <div className="space-y-4">
        {/* Images */}
        {images.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-1">
              <ImageIcon className="h-4 w-4" />
              Obrázky ({images.length})
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {images.slice(0, 6).map((img: string, idx: number) => (
                <div
                  key={idx}
                  className="aspect-square rounded-lg border bg-muted/50 overflow-hidden"
                >
                  <img
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            {images.length > 6 && (
              <p className="text-xs text-muted-foreground mt-1">
                +{images.length - 6} dalších obrázků
              </p>
            )}
          </div>
        )}

        {/* Variants */}
        {variants.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Varianty ({variants.length})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {variants.map((variant: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-md border text-sm"
                >
                  <div>
                    <span className="font-medium">
                      {variant.name || variant.label || `Varianta ${idx + 1}`}
                    </span>
                    {variant.sku && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        SKU: {variant.sku}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {variant.price != null && (
                      <span className="font-medium">
                        {formatCurrency(variant.price)}
                      </span>
                    )}
                    {variant.stock != null && (
                      <Badge
                        variant={variant.stock > 0 ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {variant.stock} ks
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
