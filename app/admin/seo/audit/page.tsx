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
  Search, Loader2, Play, ExternalLink, CheckCircle2, XCircle,
  AlertTriangle, Eye, Gauge, FileSearch, Lightbulb,
  Clock, BarChart3,
} from "lucide-react";
import { useState, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AuditResult {
  url: string;
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  h1Count: number;
  imagesWithoutAlt: number;
  hasCanonical: boolean;
  canonicalUrl: string | null;
  statusCode: number;
  auditedAt: string;
}

interface AuditIssue {
  severity: "error" | "warning" | "info";
  category: string;
  message: string;
  recommendation: string;
}

interface AuditOpportunity {
  title: string;
  impact: "high" | "medium" | "low";
  description: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("cs-CZ", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function analyzeAudit(data: AuditResult): { issues: AuditIssue[]; opportunities: AuditOpportunity[]; scores: Record<string, number> } {
  const issues: AuditIssue[] = [];
  const opportunities: AuditOpportunity[] = [];

  // Title analysis
  if (!data.title) {
    issues.push({ severity: "error", category: "Meta tagy", message: "Chybejici title tag", recommendation: "Pridejte unikatni title tag na stranku." });
  } else if (data.titleLength < 30) {
    issues.push({ severity: "warning", category: "Meta tagy", message: `Title je prilis kratky (${data.titleLength} znaku)`, recommendation: "Title by mel mit 30-60 znaku pro optimalni zobrazeni ve vysledcich vyhledavani." });
    opportunities.push({ title: "Optimalizovat delku title tagu", impact: "high", description: `Aktualni delka: ${data.titleLength} znaku. Doporucena delka: 30-60 znaku.` });
  } else if (data.titleLength > 60) {
    issues.push({ severity: "warning", category: "Meta tagy", message: `Title je prilis dlouhy (${data.titleLength} znaku)`, recommendation: "Title by mel mit maximalne 60 znaku, jinak bude ve vysledcich oriznut." });
    opportunities.push({ title: "Zkratit title tag", impact: "medium", description: `Aktualni delka: ${data.titleLength} znaku. Google zobrazuje max ~60 znaku.` });
  }

  // Meta description
  if (!data.metaDescription) {
    issues.push({ severity: "error", category: "Meta tagy", message: "Chybejici meta description", recommendation: "Pridejte meta description s 120-160 znaky vcetne klicovych slov." });
    opportunities.push({ title: "Pridat meta description", impact: "high", description: "Meta description pomaha zvysit CTR ve vysledcich vyhledavani." });
  } else if (data.metaDescriptionLength < 120) {
    issues.push({ severity: "warning", category: "Meta tagy", message: `Meta description je prilis kratka (${data.metaDescriptionLength} znaku)`, recommendation: "Meta description by mela mit 120-160 znaku." });
    opportunities.push({ title: "Rozsirit meta description", impact: "medium", description: `Aktualni delka: ${data.metaDescriptionLength} znaku. Doporucena: 120-160 znaku.` });
  } else if (data.metaDescriptionLength > 160) {
    issues.push({ severity: "info", category: "Meta tagy", message: `Meta description je delsi nez doporuceno (${data.metaDescriptionLength} znaku)`, recommendation: "Google muze zobrazit max ~160 znaku." });
  }

  // H1
  if (data.h1Count === 0) {
    issues.push({ severity: "error", category: "Struktura", message: "Stranka nema H1 nadpis", recommendation: "Kazda stranka by mela mit prave jeden H1 nadpis." });
  } else if (data.h1Count > 1) {
    issues.push({ severity: "warning", category: "Struktura", message: `Stranka ma ${data.h1Count} H1 nadpisu`, recommendation: "Doporucuje se pouzit prave jeden H1 nadpis na strance." });
  }

  // Images alt
  if (data.imagesWithoutAlt > 0) {
    issues.push({ severity: "warning", category: "Pristupnost", message: `${data.imagesWithoutAlt} obrazku bez alt textu`, recommendation: "Pridejte popisny alt text ke vsem obrazkum." });
    opportunities.push({ title: "Doplnit alt texty k obrazkum", impact: data.imagesWithoutAlt > 5 ? "high" : "medium", description: `${data.imagesWithoutAlt} obrazku bez alt textu ovlivnuje SEO i pristupnost.` });
  }

  // Canonical
  if (!data.hasCanonical) {
    issues.push({ severity: "warning", category: "Technicke SEO", message: "Chybejici canonical tag", recommendation: "Pridejte canonical URL pro prevenci duplicitniho obsahu." });
    opportunities.push({ title: "Pridat canonical tag", impact: "medium", description: "Canonical tag pomaha predchazet problemum s duplicitnim obsahem." });
  }

  // Status code
  if (data.statusCode !== 200) {
    issues.push({ severity: "error", category: "Dostupnost", message: `HTTP status kod: ${data.statusCode}`, recommendation: "Stranka by mela vracet status kod 200." });
  }

  // Calculate scores
  const errorCount = issues.filter(i => i.severity === "error").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;

  const seoScore = Math.max(0, 100 - errorCount * 20 - warningCount * 10);
  const performanceScore = Math.max(0, 100 - (data.imagesWithoutAlt > 10 ? 30 : data.imagesWithoutAlt > 5 ? 15 : 0));
  const accessibilityScore = Math.max(0, 100 - data.imagesWithoutAlt * 5);
  const bestPracticesScore = Math.max(0, 100 - (!data.hasCanonical ? 15 : 0) - (data.statusCode !== 200 ? 25 : 0));
  const overall = Math.round((seoScore + performanceScore + accessibilityScore + bestPracticesScore) / 4);

  return {
    issues,
    opportunities,
    scores: { overall, seo: seoScore, performance: performanceScore, accessibility: accessibilityScore, bestPractices: bestPracticesScore },
  };
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

function getScoreBg(score: number): string {
  if (score >= 90) return "bg-green-100 dark:bg-green-900/40";
  if (score >= 50) return "bg-yellow-100 dark:bg-yellow-900/40";
  return "bg-red-100 dark:bg-red-900/40";
}

function getScoreRing(score: number): string {
  if (score >= 90) return "border-green-500";
  if (score >= 50) return "border-yellow-500";
  return "border-red-500";
}

/* ------------------------------------------------------------------ */
/*  Score Circle Component                                             */
/* ------------------------------------------------------------------ */

function ScoreCircle({ score, label, size = "lg" }: { score: number; label: string; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "h-24 w-24" : "h-16 w-16";
  const textSize = size === "lg" ? "text-2xl" : "text-lg";
  const labelSize = size === "lg" ? "text-sm" : "text-xs";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${dim} rounded-full border-4 ${getScoreRing(score)} ${getScoreBg(score)} flex items-center justify-center`}>
        <span className={`${textSize} font-bold ${getScoreColor(score)}`}>{score}</span>
      </div>
      <span className={`${labelSize} text-muted-foreground font-medium`}>{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SEOAuditPage() {
  const { user } = useAdminAuth();
  const [url, setUrl] = useState("https://www.qsport.cz");
  const [auditHistory, setAuditHistory] = useState<Array<{ url: string; result: AuditResult; analysis: ReturnType<typeof analyzeAudit>; timestamp: string }>>([]);

  /* ---------- mutation ---------- */

  const auditMut = useMutation({
    mutationFn: async (targetUrl: string) => {
      const r = await fetch("/api/seo/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      return j.data as AuditResult;
    },
    onSuccess: (data) => {
      const analysis = analyzeAudit(data);
      setAuditHistory(prev => [{
        url: data.url,
        result: data,
        analysis,
        timestamp: data.auditedAt,
      }, ...prev]);
    },
  });

  const latestAudit = auditHistory[0] ?? null;
  const latestAnalysis = latestAudit?.analysis ?? null;

  /* ---------- derived stats ---------- */

  const stats = useMemo(() => {
    if (!latestAnalysis) return { score: 0, issues: 0, opportunities: 0, errors: 0 };
    return {
      score: latestAnalysis.scores.overall,
      issues: latestAnalysis.issues.length,
      opportunities: latestAnalysis.opportunities.length,
      errors: latestAnalysis.issues.filter(i => i.severity === "error").length,
    };
  }, [latestAnalysis]);

  /* ---------- render ---------- */

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">SEO Audit</h1>
            <p className="text-muted-foreground">Komplexni analyza technickeho SEO webu</p>
          </div>
          <a
            href="https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.qsport.cz"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              PageSpeed Insights
            </Button>
          </a>
        </div>

        {/* Audit Trigger */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Spustit audit
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
                  if (e.key === "Enter" && url) auditMut.mutate(url);
                }}
              />
              <Button
                onClick={() => auditMut.mutate(url)}
                disabled={auditMut.isPending || !url}
              >
                {auditMut.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {auditMut.isPending ? "Analyzuji..." : "Spustit audit"}
              </Button>
            </div>
            {auditMut.isError && (
              <p className="text-sm text-red-500 mt-2">
                Chyba: {(auditMut.error as Error).message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Metric Cards */}
        {latestAnalysis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Celkove skore"
              value={`${stats.score}/100`}
              icon={Gauge}
              description={stats.score >= 90 ? "Vyborny stav" : stats.score >= 50 ? "Vyzaduje pozornost" : "Kriticke problemy"}
              trend={stats.score >= 90 ? "up" : stats.score >= 50 ? "neutral" : "down"}
            />
            <MetricCard
              title="Nalezene problemy"
              value={stats.issues}
              icon={AlertTriangle}
              description={`${stats.errors} kritickych chyb`}
              trend={stats.issues === 0 ? "up" : "down"}
            />
            <MetricCard
              title="Prilezitosti"
              value={stats.opportunities}
              icon={Lightbulb}
              description="Moznosti zlepseni"
            />
            <MetricCard
              title="Provedenych auditu"
              value={auditHistory.length}
              icon={Clock}
              description={latestAudit ? `Posledni: ${fmtDate(latestAudit.timestamp)}` : "Zatim zadny audit"}
            />
          </div>
        )}

        {/* Score Circles */}
        {latestAnalysis && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Skore auditu — {latestAudit!.url}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-center gap-8 py-4">
                <ScoreCircle score={latestAnalysis.scores.overall} label="Celkove" size="lg" />
                <ScoreCircle score={latestAnalysis.scores.seo} label="SEO" size="sm" />
                <ScoreCircle score={latestAnalysis.scores.performance} label="Vykon" size="sm" />
                <ScoreCircle score={latestAnalysis.scores.accessibility} label="Pristupnost" size="sm" />
                <ScoreCircle score={latestAnalysis.scores.bestPractices} label="Osvedcene postupy" size="sm" />
              </div>

              {/* Audit details */}
              <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Title:</span>
                  <p className="font-medium truncate">{latestAudit!.result.title || "Chybi"}</p>
                  <span className="text-xs text-muted-foreground">{latestAudit!.result.titleLength} znaku</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Meta description:</span>
                  <p className="font-medium truncate">{latestAudit!.result.metaDescription ? `${latestAudit!.result.metaDescription.substring(0, 60)}...` : "Chybi"}</p>
                  <span className="text-xs text-muted-foreground">{latestAudit!.result.metaDescriptionLength} znaku</span>
                </div>
                <div>
                  <span className="text-muted-foreground">H1 nadpisy:</span>
                  <p className="font-medium">{latestAudit!.result.h1Count}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Canonical:</span>
                  <p className="font-medium">{latestAudit!.result.hasCanonical ? "Ano" : "Ne"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Issues */}
        {latestAnalysis && latestAnalysis.issues.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Nalezene problemy ({latestAnalysis.issues.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestAnalysis.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`p-1 rounded-full mt-0.5 ${
                    issue.severity === "error"
                      ? "bg-red-100 dark:bg-red-900/40"
                      : issue.severity === "warning"
                      ? "bg-yellow-100 dark:bg-yellow-900/40"
                      : "bg-blue-100 dark:bg-blue-900/40"
                  }`}>
                    {issue.severity === "error" ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : issue.severity === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{issue.message}</p>
                      <Badge variant="outline" className={`text-xs ${
                        issue.severity === "error"
                          ? "text-red-600 border-red-300"
                          : issue.severity === "warning"
                          ? "text-yellow-600 border-yellow-300"
                          : "text-blue-600 border-blue-300"
                      }`}>
                        {issue.severity === "error" ? "Chyba" : issue.severity === "warning" ? "Varovani" : "Info"}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{issue.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{issue.recommendation}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Opportunities */}
        {latestAnalysis && latestAnalysis.opportunities.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Prilezitosti ke zlepseni ({latestAnalysis.opportunities.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestAnalysis.opportunities.map((opp, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`p-1 rounded-full mt-0.5 ${
                    opp.impact === "high"
                      ? "bg-orange-100 dark:bg-orange-900/40"
                      : opp.impact === "medium"
                      ? "bg-blue-100 dark:bg-blue-900/40"
                      : "bg-gray-100 dark:bg-gray-800"
                  }`}>
                    <Lightbulb className={`h-4 w-4 ${
                      opp.impact === "high"
                        ? "text-orange-600"
                        : opp.impact === "medium"
                        ? "text-blue-600"
                        : "text-gray-600"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{opp.title}</p>
                      <Badge variant="outline" className={`text-xs ${
                        opp.impact === "high"
                          ? "text-orange-600 border-orange-300"
                          : opp.impact === "medium"
                          ? "text-blue-600 border-blue-300"
                          : "text-gray-600 border-gray-300"
                      }`}>
                        {opp.impact === "high" ? "Vysoky dopad" : opp.impact === "medium" ? "Stredni dopad" : "Nizky dopad"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{opp.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Audit History */}
        {auditHistory.length > 0 ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historie auditu ({auditHistory.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead className="text-center">Celkove skore</TableHead>
                    <TableHead className="text-center">SEO</TableHead>
                    <TableHead className="text-center">Vykon</TableHead>
                    <TableHead className="text-center">Pristupnost</TableHead>
                    <TableHead className="text-center">Problemy</TableHead>
                    <TableHead>Datum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditHistory.map((entry, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                          {(() => { try { return new URL(entry.url).hostname + new URL(entry.url).pathname; } catch { return entry.url; } })()}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${getScoreBg(entry.analysis.scores.overall)} ${getScoreColor(entry.analysis.scores.overall)} border-0`}>
                          {entry.analysis.scores.overall}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-sm font-medium ${getScoreColor(entry.analysis.scores.seo)}`}>{entry.analysis.scores.seo}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-sm font-medium ${getScoreColor(entry.analysis.scores.performance)}`}>{entry.analysis.scores.performance}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-sm font-medium ${getScoreColor(entry.analysis.scores.accessibility)}`}>{entry.analysis.scores.accessibility}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Badge variant="destructive" className="text-xs">{entry.analysis.issues.filter(i => i.severity === "error").length}</Badge>
                          <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">{entry.analysis.issues.filter(i => i.severity === "warning").length}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDate(entry.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : !auditMut.isPending && (
          <EmptyState
            icon={FileSearch}
            title="Zatim zadny audit"
            description="Zadejte URL adresu a spustte SEO audit pro analyzu technickeho stavu stranky."
            action={
              <Button onClick={() => auditMut.mutate(url)} disabled={!url}>
                <Play className="h-4 w-4 mr-2" />
                Spustit prvni audit
              </Button>
            }
          />
        )}

        {/* External Tools */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Externi nastroje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <a
                href="https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.qsport.cz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">PageSpeed Insights</p>
                  <p className="text-xs text-muted-foreground">Rychlost a Core Web Vitals</p>
                </div>
              </a>
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Google Search Console</p>
                  <p className="text-xs text-muted-foreground">Indexace a chyby</p>
                </div>
              </a>
              <a
                href="https://validator.schema.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Schema Validator</p>
                  <p className="text-xs text-muted-foreground">Kontrola strukturovanych dat</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
