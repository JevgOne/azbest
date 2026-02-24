"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, ExternalLink, CheckCircle2, XCircle, AlertTriangle,
} from "lucide-react";

interface CheckItem {
  label: string;
  description: string;
  status: "ok" | "warning" | "check";
}

const SEO_CHECKLIST: CheckItem[] = [
  { label: "Meta title na všech stránkách", description: "Každá stránka má unikátní title tag do 60 znaků", status: "check" },
  { label: "Meta description na všech stránkách", description: "Unikátní popis 120–160 znaků s klíčovými slovy", status: "check" },
  { label: "Jediný H1 na stránce", description: "Každá stránka má právě jeden H1 tag", status: "check" },
  { label: "Sitemap.xml", description: "Aktuální XML sitemap odeslaná do Search Console", status: "ok" },
  { label: "Robots.txt", description: "Správně nastavený robots.txt soubor", status: "ok" },
  { label: "HTTPS", description: "Všechny stránky se načítají přes HTTPS", status: "ok" },
  { label: "Mobilní optimalizace", description: "Responsivní design, viewport meta tag", status: "ok" },
  { label: "Rychlost načítání", description: "Core Web Vitals — LCP, FID, CLS v zelených hodnotách", status: "check" },
  { label: "Strukturovaná data (Schema.org)", description: "JSON-LD schema pro produkty, organizaci, breadcrumbs", status: "check" },
  { label: "Kanonické URL", description: "Canonical tag na všech stránkách zabraňující duplicitnímu obsahu", status: "check" },
  { label: "Alt texty u obrázků", description: "Všechny produktové obrázky mají popisný alt text", status: "warning" },
  { label: "Interní prolinkování", description: "Logická struktura odkazů mezi kategoriemi a produkty", status: "check" },
  { label: "Open Graph tagy", description: "OG title, description a image pro sdílení na sociálních sítích", status: "check" },
  { label: "Bezchybová indexace", description: "Žádné chyby indexace v Search Console", status: "check" },
];

const STATUS_CONFIG = {
  ok: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900", label: "OK" },
  warning: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900", label: "Varování" },
  check: { icon: Search, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900", label: "Zkontrolovat" },
};

export default function SEOAuditPage() {
  const { user } = useAdminAuth();

  const okCount = SEO_CHECKLIST.filter((c) => c.status === "ok").length;
  const warningCount = SEO_CHECKLIST.filter((c) => c.status === "warning").length;
  const checkCount = SEO_CHECKLIST.filter((c) => c.status === "check").length;

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">SEO Audit</h1>
            <p className="text-muted-foreground">Analýza technického SEO webu qsport.cz</p>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{okCount}</p>
                <p className="text-sm text-muted-foreground">V pořádku</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{warningCount}</p>
                <p className="text-sm text-muted-foreground">Varování</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <Search className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{checkCount}</p>
                <p className="text-sm text-muted-foreground">Ke kontrole</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SEO Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {SEO_CHECKLIST.map((item, i) => {
              const config = STATUS_CONFIG[item.status];
              const Icon = config.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <div className={`p-1 rounded-full ${config.bg} mt-0.5`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{item.label}</p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          item.status === "ok"
                            ? "text-green-600 border-green-300"
                            : item.status === "warning"
                            ? "text-yellow-600 border-yellow-300"
                            : "text-blue-600 border-blue-300"
                        }`}
                      >
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* External Tools */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Externí nástroje</CardTitle>
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
                  <p className="text-xs text-muted-foreground">Kontrola strukturovaných dat</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
