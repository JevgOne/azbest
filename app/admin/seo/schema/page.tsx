"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricCard } from "@/components/admin/MetricCard";
import {
  Loader2, Play, CheckCircle2, XCircle, AlertTriangle,
  Braces, ExternalLink, Search, Clock, ShieldCheck,
  FileJson, ChevronDown, ChevronUp, Copy, Check,
} from "lucide-react";
import { useState, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SchemaAnalysis {
  url: string;
  jsonLdSchemas: any[];
  jsonLdCount: number;
  hasMicrodata: boolean;
  schemaTypes: string[];
  hasProduct: boolean;
  hasOrganization: boolean;
  hasBreadcrumb: boolean;
  hasLocalBusiness: boolean;
}

interface SchemaValidation {
  type: string;
  schema: any;
  isValid: boolean;
  issues: SchemaIssue[];
  requiredFields: { field: string; present: boolean; value?: any }[];
}

interface SchemaIssue {
  severity: "error" | "warning" | "info";
  field: string;
  message: string;
}

interface ValidationHistoryEntry {
  url: string;
  analysis: SchemaAnalysis;
  validations: SchemaValidation[];
  timestamp: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers — schema validation                                        */
/* ------------------------------------------------------------------ */

const SCHEMA_REQUIRED_FIELDS: Record<string, string[]> = {
  Product: ["@type", "name", "description", "image", "offers"],
  Organization: ["@type", "name", "url", "logo"],
  LocalBusiness: ["@type", "name", "address", "telephone"],
  BreadcrumbList: ["@type", "itemListElement"],
  WebSite: ["@type", "name", "url"],
  WebPage: ["@type", "name", "url"],
  FAQPage: ["@type", "mainEntity"],
  Article: ["@type", "headline", "author", "datePublished"],
  Review: ["@type", "itemReviewed", "reviewRating", "author"],
  AggregateRating: ["@type", "ratingValue", "reviewCount"],
  Offer: ["@type", "price", "priceCurrency", "availability"],
};

const SCHEMA_RECOMMENDED_FIELDS: Record<string, string[]> = {
  Product: ["sku", "brand", "aggregateRating", "review"],
  Organization: ["sameAs", "contactPoint", "description"],
  LocalBusiness: ["openingHours", "geo", "priceRange"],
  BreadcrumbList: [],
  WebSite: ["potentialAction"],
};

function validateSchema(schema: any): SchemaValidation {
  const type = schema["@type"] || "Neznamy";
  const issues: SchemaIssue[] = [];
  const requiredFields: { field: string; present: boolean; value?: any }[] = [];

  // Check required fields
  const required = SCHEMA_REQUIRED_FIELDS[type] || ["@type"];
  for (const field of required) {
    const present = schema[field] !== undefined && schema[field] !== null && schema[field] !== "";
    requiredFields.push({ field, present, value: present ? schema[field] : undefined });
    if (!present) {
      issues.push({ severity: "error", field, message: `Chybejici povinne pole "${field}"` });
    }
  }

  // Check recommended fields
  const recommended = SCHEMA_RECOMMENDED_FIELDS[type] || [];
  for (const field of recommended) {
    const present = schema[field] !== undefined && schema[field] !== null;
    if (!present) {
      issues.push({ severity: "warning", field, message: `Doporucene pole "${field}" neni nastaveno` });
    }
  }

  // Type-specific checks
  if (type === "Product") {
    if (schema.offers) {
      const offers = Array.isArray(schema.offers) ? schema.offers : [schema.offers];
      for (const offer of offers) {
        if (!offer.price) issues.push({ severity: "error", field: "offers.price", message: "Nabidka nema definovanou cenu" });
        if (!offer.priceCurrency) issues.push({ severity: "warning", field: "offers.priceCurrency", message: "Nabidka nema definovanou menu" });
        if (!offer.availability) issues.push({ severity: "warning", field: "offers.availability", message: "Nabidka nema definovanou dostupnost" });
      }
    }
    if (schema.image && typeof schema.image === "string" && !schema.image.startsWith("http")) {
      issues.push({ severity: "warning", field: "image", message: "Obrazek by mel pouzivat absolutni URL" });
    }
  }

  if (type === "BreadcrumbList") {
    if (schema.itemListElement && Array.isArray(schema.itemListElement)) {
      schema.itemListElement.forEach((item: any, i: number) => {
        if (!item.name) issues.push({ severity: "warning", field: `itemListElement[${i}].name`, message: `Polozka drobecku #${i + 1} nema nazev` });
        if (!item.item && i < schema.itemListElement.length - 1) {
          issues.push({ severity: "warning", field: `itemListElement[${i}].item`, message: `Polozka drobecku #${i + 1} nema URL` });
        }
      });
    }
  }

  if (type === "Organization" || type === "LocalBusiness") {
    if (schema.logo && typeof schema.logo === "string" && !schema.logo.startsWith("http")) {
      issues.push({ severity: "warning", field: "logo", message: "Logo by melo pouzivat absolutni URL" });
    }
  }

  // Check @context
  if (!schema["@context"] || !String(schema["@context"]).includes("schema.org")) {
    issues.push({ severity: "info", field: "@context", message: "Chybejici nebo neplatny @context (mel by byt https://schema.org)" });
  }

  const errorCount = issues.filter(i => i.severity === "error").length;
  const isValid = errorCount === 0;

  return { type, schema, isValid, issues, requiredFields };
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("cs-CZ", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getSchemaIcon(type: string): string {
  const icons: Record<string, string> = {
    Product: "🛍️",
    Organization: "🏢",
    LocalBusiness: "📍",
    BreadcrumbList: "🔗",
    WebSite: "🌐",
    WebPage: "📄",
    FAQPage: "❓",
    Article: "📰",
    Review: "⭐",
  };
  return icons[type] || "📋";
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SEOSchemaPage() {
  const { user } = useAdminAuth();
  const [url, setUrl] = useState("https://www.qsport.cz");
  const [history, setHistory] = useState<ValidationHistoryEntry[]>([]);
  const [expandedSchema, setExpandedSchema] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  /* ---------- mutation ---------- */

  const validateMut = useMutation({
    mutationFn: async (targetUrl: string) => {
      const r = await fetch("/api/seo/schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      return j.data as SchemaAnalysis;
    },
    onSuccess: (data) => {
      const validations = data.jsonLdSchemas.map(validateSchema);
      setHistory(prev => [{
        url: data.url,
        analysis: data,
        validations,
        timestamp: new Date().toISOString(),
      }, ...prev]);
      setExpandedSchema(null);
    },
  });

  const latest = history[0] ?? null;

  /* ---------- derived ---------- */

  const stats = useMemo(() => {
    if (!latest) return { totalSchemas: 0, validSchemas: 0, totalIssues: 0, errorCount: 0 };
    const totalSchemas = latest.validations.length;
    const validSchemas = latest.validations.filter(v => v.isValid).length;
    const totalIssues = latest.validations.reduce((sum, v) => sum + v.issues.length, 0);
    const errorCount = latest.validations.reduce((sum, v) => sum + v.issues.filter(i => i.severity === "error").length, 0);
    return { totalSchemas, validSchemas, totalIssues, errorCount };
  }, [latest]);

  const handleCopySchema = (index: number, schema: any) => {
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  /* ---------- render ---------- */

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Schema.org</h1>
            <p className="text-muted-foreground">Validace strukturovanych dat (JSON-LD)</p>
          </div>
          <a
            href="https://validator.schema.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Schema Validator
            </Button>
          </a>
        </div>

        {/* URL Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Validovat strukturovana data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="https://www.qsport.cz"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="flex-1"
                onKeyDown={e => {
                  if (e.key === "Enter" && url) validateMut.mutate(url);
                }}
              />
              <Button
                onClick={() => validateMut.mutate(url)}
                disabled={validateMut.isPending || !url}
              >
                {validateMut.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {validateMut.isPending ? "Validuji..." : "Validovat"}
              </Button>
            </div>
            {validateMut.isError && (
              <p className="text-sm text-red-500 mt-2">
                Chyba: {(validateMut.error as Error).message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Metric Cards */}
        {latest && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Nalezena schemata"
              value={stats.totalSchemas}
              icon={Braces}
              description={`${latest.analysis.hasMicrodata ? "Vcetne microdata" : "Pouze JSON-LD"}`}
            />
            <MetricCard
              title="Validni schemata"
              value={`${stats.validSchemas}/${stats.totalSchemas}`}
              icon={ShieldCheck}
              description={stats.validSchemas === stats.totalSchemas ? "Vsechna v poradku" : "Nektere vyzaduji opravu"}
              trend={stats.validSchemas === stats.totalSchemas ? "up" : "down"}
            />
            <MetricCard
              title="Nalezene problemy"
              value={stats.totalIssues}
              icon={AlertTriangle}
              description={`${stats.errorCount} kritickych chyb`}
              trend={stats.totalIssues === 0 ? "up" : "down"}
            />
            <MetricCard
              title="Validaci provedeno"
              value={history.length}
              icon={Clock}
              description={`Posledni: ${fmtDate(latest.timestamp)}`}
            />
          </div>
        )}

        {/* Detected Schema Types */}
        {latest && latest.analysis.schemaTypes.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Braces className="h-5 w-5" />
                Detekovana schemata — {latest.url}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {latest.analysis.schemaTypes.map((type, i) => (
                  <Badge key={i} variant="outline" className="text-sm py-1 px-3">
                    <span className="mr-1">{getSchemaIcon(type)}</span>
                    {type}
                  </Badge>
                ))}
                {latest.analysis.hasMicrodata && (
                  <Badge variant="secondary" className="text-sm py-1 px-3">
                    Microdata detekovana
                  </Badge>
                )}
              </div>

              {/* Quick status */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Product", present: latest.analysis.hasProduct },
                  { label: "Organization", present: latest.analysis.hasOrganization },
                  { label: "BreadcrumbList", present: latest.analysis.hasBreadcrumb },
                  { label: "LocalBusiness", present: latest.analysis.hasLocalBusiness },
                ].map(item => (
                  <div key={item.label} className={`flex items-center gap-2 p-2 rounded-lg border ${item.present ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"}`}>
                    {item.present ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={`text-sm ${item.present ? "text-green-700 dark:text-green-400 font-medium" : "text-muted-foreground"}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Validation Results */}
        {latest && latest.validations.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Vysledky validace ({latest.validations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {latest.validations.map((validation, i) => (
                <div key={i} className="rounded-lg border overflow-hidden">
                  {/* Schema header */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50"
                    onClick={() => setExpandedSchema(expandedSchema === i ? null : i)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getSchemaIcon(validation.type)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{validation.type}</span>
                          {validation.isValid ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-0">
                              <CheckCircle2 className="h-3 w-3 mr-1" />Validni
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-0">
                              <XCircle className="h-3 w-3 mr-1" />Nevalidni
                            </Badge>
                          )}
                          {validation.issues.filter(iss => iss.severity === "warning").length > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-0">
                              <AlertTriangle className="h-3 w-3 mr-1" />{validation.issues.filter(iss => iss.severity === "warning").length} varovani
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {validation.requiredFields.filter(f => f.present).length}/{validation.requiredFields.length} povinnych poli
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleCopySchema(i, validation.schema); }}
                      >
                        {copiedIndex === i ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      {expandedSchema === i ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expandedSchema === i && (
                    <div className="border-t p-3 space-y-4">
                      {/* Required fields */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Povinna pole</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {validation.requiredFields.map((field, fi) => (
                            <div
                              key={fi}
                              className={`flex items-center gap-2 p-2 rounded text-sm ${
                                field.present
                                  ? "bg-green-50 dark:bg-green-900/20"
                                  : "bg-red-50 dark:bg-red-900/20"
                              }`}
                            >
                              {field.present ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                              )}
                              <span className={`font-mono text-xs ${field.present ? "" : "text-red-600 font-medium"}`}>
                                {field.field}
                              </span>
                              {field.present && field.value !== undefined && (
                                <span className="text-muted-foreground truncate ml-auto text-xs max-w-[200px]">
                                  {typeof field.value === "object" ? JSON.stringify(field.value).substring(0, 50) + "..." : String(field.value).substring(0, 80)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Issues */}
                      {validation.issues.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Problemy ({validation.issues.length})</h4>
                          <div className="space-y-2">
                            {validation.issues.map((issue, ii) => (
                              <div key={ii} className="flex items-start gap-2 text-sm">
                                {issue.severity === "error" ? (
                                  <XCircle className="h-3.5 w-3.5 text-red-600 mt-0.5 shrink-0" />
                                ) : issue.severity === "warning" ? (
                                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 mt-0.5 shrink-0" />
                                ) : (
                                  <AlertTriangle className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
                                )}
                                <div>
                                  <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{issue.field}</span>
                                  <span className="ml-2">{issue.message}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {validation.issues.length === 0 && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Schema je plne validni bez problemu.
                        </div>
                      )}

                      {/* Raw JSON preview */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2">JSON-LD zdrojovy kod</h4>
                        <pre className="bg-muted/50 p-3 rounded-lg text-xs overflow-x-auto max-h-48 overflow-y-auto font-mono">
                          {JSON.stringify(validation.schema, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* No schemas found */}
        {latest && latest.validations.length === 0 && (
          <Card className="mb-6">
            <CardContent className="py-8">
              <div className="flex flex-col items-center text-center">
                <XCircle className="h-12 w-12 text-red-400 mb-3" />
                <h3 className="text-lg font-semibold mb-1">Zadna strukturovana data</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Na adrese {latest.url} nebyla nalezena zadna JSON-LD strukturovana data.
                  Doporucujeme pridat alespon Product, Organization a BreadcrumbList schema.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Validation History */}
        {history.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historie validaci
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead className="text-center">Schemata</TableHead>
                    <TableHead className="text-center">Validni</TableHead>
                    <TableHead className="text-center">Problemy</TableHead>
                    <TableHead className="text-center">Typy</TableHead>
                    <TableHead>Datum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry, i) => {
                    const valid = entry.validations.filter(v => v.isValid).length;
                    const total = entry.validations.length;
                    const issueCount = entry.validations.reduce((s, v) => s + v.issues.length, 0);
                    return (
                      <TableRow key={i}>
                        <TableCell>
                          <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            {(() => { try { return new URL(entry.url).hostname + new URL(entry.url).pathname; } catch { return entry.url; } })()}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                        <TableCell className="text-center font-medium">{total}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${valid === total ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"} border-0`}>
                            {valid}/{total}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {issueCount > 0 ? (
                            <Badge variant="destructive" className="text-xs">{issueCount}</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800 border-0 text-xs">0</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {entry.analysis.schemaTypes.map((t, ti) => (
                              <Badge key={ti} variant="outline" className="text-xs">{t}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(entry.timestamp)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!latest && !validateMut.isPending && (
          <EmptyState
            icon={FileJson}
            title="Zatim zadna validace"
            description="Zadejte URL adresu a validujte strukturovana data (JSON-LD, Schema.org) na vasem webu."
            action={
              <Button onClick={() => validateMut.mutate(url)} disabled={!url}>
                <Play className="h-4 w-4 mr-2" />
                Spustit prvni validaci
              </Button>
            }
          />
        )}

        {/* Reference Links */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Uzitecne zdroje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <a
                href="https://validator.schema.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Schema.org Validator</p>
                  <p className="text-xs text-muted-foreground">Oficialni validator strukturovanych dat</p>
                </div>
              </a>
              <a
                href="https://search.google.com/test/rich-results"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Google Rich Results Test</p>
                  <p className="text-xs text-muted-foreground">Test bohatych vysledku vyhledavani</p>
                </div>
              </a>
              <a
                href="https://schema.org/docs/full.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Schema.org Dokumentace</p>
                  <p className="text-xs text-muted-foreground">Kompletni seznam schemat a vlastnosti</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
