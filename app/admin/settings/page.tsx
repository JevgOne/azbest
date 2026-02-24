"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings, ShoppingBag, Target, Share2, Search, Mail, MessageSquare,
  BarChart3, Globe, RefreshCw, CheckCircle, XCircle, Loader2, ChevronDown,
  Save, Zap,
} from "lucide-react";
import { useState } from "react";

const PLATFORM_ICONS: Record<string, any> = {
  shoptet: ShoppingBag,
  google_ads: Target,
  meta_ads: Share2,
  sklik: Target,
  heureka: ShoppingBag,
  zbozi: ShoppingBag,
  mergado: RefreshCw,
  genviral: Zap,
  ecomail: Mail,
  gosms: MessageSquare,
  google_analytics: BarChart3,
  search_console: Globe,
};

interface PlatformKey {
  key: string;
  label: string;
  secret: boolean;
  configured: boolean;
  inDb: boolean;
  masked: string | null;
}

interface PlatformConfig {
  id: string;
  label: string;
  keys: PlatformKey[];
}

function PlatformSection({ platform, onSaved }: { platform: PlatformConfig; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const Icon = PLATFORM_ICONS[platform.id] || Settings;
  const configuredCount = platform.keys.filter((k) => k.configured).length;
  const allConfigured = configuredCount === platform.keys.length;

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      // Only send non-empty values
      const keysToSave: Record<string, string> = {};
      for (const [key, value] of Object.entries(values)) {
        if (value.trim()) keysToSave[key] = value;
      }
      if (!Object.keys(keysToSave).length) return;

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: keysToSave }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setValues({});
      onSaved();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platform.id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setTestResult(json.data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {platform.label}
          </CardTitle>
          <div className="flex items-center gap-2">
            {allConfigured ? (
              <Badge variant="outline" className="text-green-600 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Nastaveno
              </Badge>
            ) : configuredCount > 0 ? (
              <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                {configuredCount}/{platform.keys.length}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                <XCircle className="h-3 w-3 mr-1" />
                Nepřipojeno
              </Badge>
            )}
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4 border-t pt-4">
          {platform.keys.map((k) => (
            <div key={k.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor={k.key} className="text-xs">
                  {k.label}
                  <span className="text-muted-foreground ml-1 font-mono text-[10px]">
                    {k.key}
                  </span>
                </Label>
                {k.configured && (
                  <span className="text-xs text-muted-foreground">
                    {k.inDb ? "DB" : "ENV"}: {k.masked}
                  </span>
                )}
              </div>
              {k.key === "GOOGLE_SERVICE_ACCOUNT_KEY" ? (
                <Textarea
                  id={k.key}
                  placeholder={k.configured ? "Ponechte prázdné pro zachování" : "Zadejte JSON klíč..."}
                  value={values[k.key] || ""}
                  onChange={(e) => setValues({ ...values, [k.key]: e.target.value })}
                  rows={3}
                  className="font-mono text-xs"
                />
              ) : (
                <Input
                  id={k.key}
                  type={k.secret ? "password" : "text"}
                  placeholder={k.configured ? "Ponechte prázdné pro zachování" : "Zadejte hodnotu..."}
                  value={values[k.key] || ""}
                  onChange={(e) => setValues({ ...values, [k.key]: e.target.value })}
                  className="font-mono text-sm"
                />
              )}
            </div>
          ))}

          {saveError && (
            <p className="text-sm text-red-500">{saveError}</p>
          )}

          {testResult && (
            <div className={`text-sm p-2 rounded ${testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {testResult.success ? "Připojení úspěšné" : `Chyba: ${testResult.error}`}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !Object.values(values).some(v => v.trim())}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Uložit
            </Button>
            <Button size="sm" variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Otestovat připojení
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function SettingsPage() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();

  const { data: platforms, isLoading } = useQuery({
    queryKey: ["settings-platforms"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as PlatformConfig[];
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["settings-platforms"] });
  };

  if (isLoading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const totalConfigured = platforms?.reduce(
    (acc, p) => acc + (p.keys.every((k) => k.configured) ? 1 : 0),
    0
  ) || 0;

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Nastavení</h1>
            <p className="text-muted-foreground">
              Konfigurace API klíčů a integrace — {totalConfigured}/{platforms?.length || 0} platforem připojeno
            </p>
          </div>
        </div>

        <div className="space-y-3 max-w-3xl">
          {platforms?.map((platform) => (
            <PlatformSection
              key={platform.id}
              platform={platform}
              onSaved={handleRefresh}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
