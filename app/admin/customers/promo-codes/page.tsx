"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Ticket, Plus, Loader2, Trash2, Copy, CheckCircle,
  Percent, DollarSign, Truck, BarChart3, Tag, Power,
} from "lucide-react";
import { useState } from "react";

interface PromoCode {
  id: number;
  code: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  min_order_value?: number;
  max_uses?: number;
  uses_count: number;
  expires_at?: number;
  target_segment?: string;
  shoptet_synced?: number;
  active: number;
  created_by?: string;
  created_at: number;
  updated_at?: number;
}

const TYPE_LABELS: Record<string, string> = {
  percentage: "Procentualni",
  fixed: "Pevna castka",
  free_shipping: "Doprava zdarma",
};

const TYPE_ICONS: Record<string, typeof Percent> = {
  percentage: Percent,
  fixed: DollarSign,
  free_shipping: Truck,
};

function formatDate(ts: number): string {
  if (!ts) return "\u2014";
  return new Date(ts * 1000).toLocaleDateString("cs-CZ", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatCZK(value: number): string {
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);
}

function formatDiscount(type: string, value: number): string {
  if (type === "percentage") return `${value} %`;
  if (type === "fixed") return formatCZK(value);
  if (type === "free_shipping") return "Doprava zdarma";
  return String(value);
}

function isExpired(expiresAt?: number): boolean {
  if (!expiresAt) return false;
  return expiresAt * 1000 < Date.now();
}

export default function PromoCodesPage() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ["promo-codes"],
    queryFn: async () => {
      const res = await fetch("/api/customers/promo-codes");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as PromoCode[];
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const res = await fetch("/api/customers/promo-codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["promo-codes"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/customers/promo-codes?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["promo-codes"] }),
  });

  const codes = promoCodes || [];
  const activeCodes = codes.filter((c) => c.active && !isExpired(c.expires_at));
  const totalUses = codes.reduce((sum, c) => sum + (Number(c.uses_count) || 0), 0);
  const totalDiscountValue = codes.reduce((sum, c) => {
    if (c.discount_type === "fixed") return sum + (Number(c.discount_value) || 0) * (Number(c.uses_count) || 0);
    return sum;
  }, 0);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Promo kody</h1>
            <p className="text-muted-foreground">Sprava slevovych kodu se synchronizaci do Shoptet</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novy promo kod
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Aktivni kody"
            value={activeCodes.length.toLocaleString("cs-CZ")}
            icon={Tag}
            description={`z celkem ${codes.length} kodu`}
          />
          <MetricCard
            title="Celkem pouziti"
            value={totalUses.toLocaleString("cs-CZ")}
            icon={BarChart3}
            description="Vsechny kody dohromady"
          />
          <MetricCard
            title="Celkova sleva (pevne)"
            value={formatCZK(totalDiscountValue)}
            icon={DollarSign}
            description="Souhrn za pevne castky"
          />
          <MetricCard
            title="Prumerne pouziti"
            value={codes.length > 0 ? (totalUses / codes.length).toFixed(1) : "0"}
            icon={Ticket}
            description="Na jeden kod"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Nacitani promo kodu...</span>
          </div>
        ) : !codes.length ? (
          <EmptyState
            icon={Ticket}
            title="Zadne promo kody"
            description="Vytvorte prvni slevovy kod pro vase zakazniky."
            action={
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novy promo kod
              </Button>
            }
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Promo kody ({codes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kod</TableHead>
                    <TableHead>Popis</TableHead>
                    <TableHead>Typ slevy</TableHead>
                    <TableHead>Hodnota</TableHead>
                    <TableHead>Min. objednavka</TableHead>
                    <TableHead>Pouziti</TableHead>
                    <TableHead>Platnost do</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead>Aktivni</TableHead>
                    <TableHead>Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((code) => {
                    const expired = isExpired(code.expires_at);
                    const TypeIcon = TYPE_ICONS[code.discount_type] || Percent;
                    return (
                      <TableRow key={code.id} className={expired ? "opacity-60" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-muted rounded text-sm font-mono font-bold">
                              {code.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => copyCode(code.code)}
                              title="Kopirovat kod"
                            >
                              {copiedCode === code.code ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                          <span className="line-clamp-1">{code.description || "\u2014"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <TypeIcon className="h-3 w-3" />
                            {TYPE_LABELS[code.discount_type] || code.discount_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatDiscount(code.discount_type, Number(code.discount_value))}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {code.min_order_value ? formatCZK(Number(code.min_order_value)) : "\u2014"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{Number(code.uses_count) || 0}</span>
                            {code.max_uses && (
                              <span className="text-muted-foreground">/ {code.max_uses}</span>
                            )}
                          </div>
                          {code.max_uses && (
                            <div className="w-16 h-1.5 bg-muted rounded-full mt-1">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${Math.min(((Number(code.uses_count) || 0) / Number(code.max_uses)) * 100, 100)}%` }}
                              />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {code.expires_at ? (
                            <span className={expired ? "text-red-600" : "text-muted-foreground"}>
                              {formatDate(code.expires_at)}
                              {expired && " (vyprselo)"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Bez omezeni</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {expired ? (
                            <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-0">
                              Vyprselo
                            </Badge>
                          ) : code.active ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-0">
                              Aktivni
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-0">
                              Neaktivni
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={!!code.active}
                            onCheckedChange={(checked) =>
                              toggleActiveMutation.mutate({ id: code.id, active: checked })
                            }
                            disabled={toggleActiveMutation.isPending}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Opravdu smazat promo kod ${code.code}?`)) {
                                deleteMutation.mutate(code.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Create Promo Code Dialog */}
        {showCreate && (
          <CreatePromoCodeDialog
            onClose={() => setShowCreate(false)}
            onSuccess={() => {
              setShowCreate(false);
              queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
            }}
          />
        )}
      </main>
    </div>
  );
}

function CreatePromoCodeDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const handleSubmit = async () => {
    if (!code.trim() || !discountValue) return;
    setSubmitting(true);
    setError(null);
    try {
      const body: any = {
        code: code.toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        description: description || null,
        minOrderValue: minOrderValue ? Number(minOrderValue) : null,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : null,
      };
      const res = await fetch("/api/customers/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novy promo kod</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}

          <div>
            <Label htmlFor="promo-code">Kod</Label>
            <div className="flex gap-2">
              <Input
                id="promo-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="napr. LETO2026"
                className="font-mono"
              />
              <Button variant="outline" type="button" onClick={generateCode}>
                Generovat
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="promo-description">Popis (volitelne)</Label>
            <Textarea
              id="promo-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Interni poznamka k promo kodu..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount-type">Typ slevy</Label>
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Procentualni (%)</SelectItem>
                  <SelectItem value="fixed">Pevna castka (CZK)</SelectItem>
                  <SelectItem value="free_shipping">Doprava zdarma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="discount-value">
                {discountType === "percentage" ? "Sleva (%)" : discountType === "fixed" ? "Sleva (CZK)" : "Hodnota"}
              </Label>
              <Input
                id="discount-value"
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percentage" ? "napr. 15" : "napr. 200"}
                disabled={discountType === "free_shipping"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min-order">Minimalni objednavka (CZK)</Label>
              <Input
                id="min-order"
                type="number"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                placeholder="Volitelne"
              />
            </div>
            <div>
              <Label htmlFor="max-uses">Maximalni pocet pouziti</Label>
              <Input
                id="max-uses"
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Neomezene"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="expires-at">Platnost do</Label>
            <Input
              id="expires-at"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Zrusit
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !code.trim() || (!discountValue && discountType !== "free_shipping")}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Vytvorit kod
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
