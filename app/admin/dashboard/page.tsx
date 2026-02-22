"use client";

import { useAdminAuth } from "../_components/AdminAuthProvider";
import { AdminSidebar } from "../_components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package, ShoppingCart, Users, TrendingUp, ArrowUpRight, ArrowDownRight,
  DollarSign, Eye, MousePointerClick, BarChart3,
} from "lucide-react";

const stats = [
  { label: "Produkty", value: "4,200+", change: "+12", trend: "up", icon: Package },
  { label: "Objedn\u00E1vky (dnes)", value: "\u2014", change: "\u2014", trend: "neutral", icon: ShoppingCart },
  { label: "Z\u00E1kazn\u00EDci", value: "\u2014", change: "\u2014", trend: "neutral", icon: Users },
  { label: "Tr\u017Eby (m\u011Bs\u00EDc)", value: "\u2014", change: "\u2014", trend: "neutral", icon: DollarSign },
  { label: "N\u00E1v\u0161t\u011Bvnost", value: "\u2014", change: "\u2014", trend: "neutral", icon: Eye },
  { label: "Konverze", value: "\u2014", change: "\u2014", trend: "neutral", icon: MousePointerClick },
  { label: "ROAS", value: "\u2014", change: "\u2014", trend: "neutral", icon: TrendingUp },
  { label: "Opu\u0161t\u011Bn\u00E9 ko\u0161\u00EDky", value: "\u2014", change: "\u2014", trend: "neutral", icon: BarChart3 },
];

export default function DashboardPage() {
  const { user } = useAdminAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            V\u00EDtejte zp\u011Bt, {user?.name}. P\u0159ehled va\u0161eho marketingu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {stat.trend === "up" && <ArrowUpRight className="h-3 w-3 text-green-500" />}
                  {stat.trend === "down" && <ArrowDownRight className="h-3 w-3 text-red-500" />}
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Posledn\u00ED aktivita</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                P\u0159ipojte Shoptet API a analytiku pro zobrazen\u00ED dat.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Rychl\u00E9 akce</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                1. Nastavte Shoptet API kl\u00ED\u010De v Nastaven\u00ED
              </p>
              <p className="text-sm text-muted-foreground">
                2. Spus\u0165te prvn\u00ED synchronizaci produkt\u016F
              </p>
              <p className="text-sm text-muted-foreground">
                3. Propojte Google Analytics a Ads \u00FA\u010Dty
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
