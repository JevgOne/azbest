"use client";

import { useAdminAuth } from "../_components/AdminAuthProvider";
import { AdminSidebar } from "../_components/AdminSidebar";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/admin/MetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Package, ShoppingCart, Users, DollarSign, Eye, BarChart3,
  Activity, Send, Clock, AlertTriangle,
} from "lucide-react";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  ordersToday: number;
  totalCustomers: number;
  abandonedCarts: number;
  totalRevenue: number;
  revenueMonth: number;
  socialPosts: number;
  recentActivity: {
    id: number;
    action: string;
    entity_type: string | null;
    entity_name: string | null;
    details: string | null;
    user_name: string | null;
    created_at: number;
  }[];
}

const ACTION_LABELS: Record<string, string> = {
  user_login: "Přihlášení",
  settings_updated: "Nastavení změněno",
  shoptet_sync: "Synchronizace Shoptet",
  social_post_created: "Příspěvek vytvořen",
  social_post_published: "Příspěvek publikován",
  social_analytics_synced: "Analytika synchronizována",
  ads_synced: "Reklamy synchronizovány",
  keyword_tracked: "Klíčové slovo sledováno",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("cs-CZ").format(value);
}

function timeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 60) return "právě teď";
  if (diff < 3600) return `před ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `před ${Math.floor(diff / 3600)} hod`;
  return `před ${Math.floor(diff / 86400)} dny`;
}

export default function DashboardPage() {
  const { user } = useAdminAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as DashboardStats;
    },
    refetchInterval: 60000,
  });

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Vítejte zpět, {user?.name}. Přehled vašeho marketingu.
          </p>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              title="Produkty"
              value={formatNumber(data?.totalProducts || 0)}
              icon={Package}
              description="Celkem v katalogu"
            />
            <MetricCard
              title="Objednávky dnes"
              value={formatNumber(data?.ordersToday || 0)}
              icon={ShoppingCart}
              description={`Celkem: ${formatNumber(data?.totalOrders || 0)}`}
            />
            <MetricCard
              title="Zákazníci"
              value={formatNumber(data?.totalCustomers || 0)}
              icon={Users}
              description="Registrovaní zákazníci"
            />
            <MetricCard
              title="Tržby (měsíc)"
              value={formatCurrency(data?.revenueMonth || 0)}
              icon={DollarSign}
              description={`Celkem: ${formatCurrency(data?.totalRevenue || 0)}`}
            />
            <MetricCard
              title="Publikované příspěvky"
              value={formatNumber(data?.socialPosts || 0)}
              icon={Send}
              description="Na sociálních sítích"
            />
            <MetricCard
              title="Opuštěné košíky"
              value={formatNumber(data?.abandonedCarts || 0)}
              icon={AlertTriangle}
              description="Neobnovené"
              trend={data?.abandonedCarts && data.abandonedCarts > 10 ? "down" : "neutral"}
            />
          </div>
        )}

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Poslední aktivita
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : !data?.recentActivity?.length ? (
                <p className="text-sm text-muted-foreground">Zatím žádná aktivita.</p>
              ) : (
                <div className="space-y-3">
                  {data.recentActivity.map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {ACTION_LABELS[log.action] || log.action}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {log.details || log.entity_name || "—"}
                          {log.user_name && ` · ${log.user_name}`}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {timeAgo(log.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Rychlý přehled
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuickLink
                href="/admin/social/auto-posting"
                label="Auto-posting"
                description="Automatické postování produktů na IG/FB"
                icon={Send}
              />
              <QuickLink
                href="/admin/social/planner"
                label="Social Planner"
                description="Plánování příspěvků přes GenViral"
                icon={Clock}
              />
              <QuickLink
                href="/admin/analytics/search-console"
                label="Search Console"
                description="Výkon ve vyhledávání Google"
                icon={Eye}
              />
              <QuickLink
                href="/admin/shoptet/products"
                label="Produkty"
                description="Správa produktového katalogu"
                icon={Package}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function QuickLink({ href, label, description, icon: Icon }: {
  href: string; label: string; description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
    >
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </a>
  );
}
