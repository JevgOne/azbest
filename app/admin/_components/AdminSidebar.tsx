"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "./AdminAuthProvider";
import {
  LayoutDashboard, ShoppingBag, Package, Users, ShoppingCart,
  RefreshCw, Megaphone, BarChart3, Search, Mail, Bell, MessageSquare,
  Share2, PenTool, Palette, Image, UserCheck, Star, Ticket,
  Eye, Calendar, User, Link2, Activity, Settings, LogOut, ChevronDown,
  Globe, Target, TrendingUp, FileText, Sparkles,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href?: string;
  icon: any;
  permission?: string;
  children?: { label: string; href: string }[];
}

const navigation: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  {
    label: "Shoptet",
    icon: ShoppingBag,
    permission: "shoptet",
    children: [
      { label: "Produkty", href: "/admin/shoptet/products" },
      { label: "Objedn\u00E1vky", href: "/admin/shoptet/orders" },
      { label: "Z\u00E1kazn\u00EDci", href: "/admin/shoptet/customers" },
      { label: "Opu\u0161t\u011Bn\u00E9 ko\u0161\u00EDky", href: "/admin/shoptet/abandoned-carts" },
      { label: "Synchronizace", href: "/admin/shoptet/sync" },
    ],
  },
  {
    label: "Reklama",
    icon: Megaphone,
    permission: "advertising",
    children: [
      { label: "Přehled", href: "/admin/advertising" },
      { label: "Google Ads", href: "/admin/advertising/google-ads" },
      { label: "Meta Ads", href: "/admin/advertising/meta-ads" },
      { label: "Sklik", href: "/admin/advertising/sklik" },
      { label: "Heureka & Zboží", href: "/admin/advertising/heureka-zbozi" },
      { label: "Mergado", href: "/admin/advertising/mergado" },
    ],
  },
  {
    label: "Analytics",
    icon: BarChart3,
    permission: "analytics",
    children: [
      { label: "Google Analytics", href: "/admin/analytics/ga4" },
      { label: "Search Console", href: "/admin/analytics/search-console" },
      { label: "Zprávy", href: "/admin/analytics/reports" },
    ],
  },
  {
    label: "SEO",
    icon: Search,
    permission: "seo",
    children: [
      { label: "Audit", href: "/admin/seo/audit" },
      { label: "Keywords", href: "/admin/seo/keywords" },
      { label: "Meta tagy", href: "/admin/seo/meta-tags" },
      { label: "Schema.org", href: "/admin/seo/schema" },
    ],
  },
  {
    label: "Komunikace",
    icon: Mail,
    children: [
      { label: "Email / Ecomail", href: "/admin/email" },
      { label: "Push notifikace", href: "/admin/push-notifications" },
      { label: "SMS", href: "/admin/sms" },
    ],
  },
  {
    label: "Content",
    icon: PenTool,
    children: [
      { label: "Social planner", href: "/admin/social/planner" },
      { label: "Auto-posting", href: "/admin/social/auto-posting" },
      { label: "Blog", href: "/admin/social/blog" },
      { label: "Nano Banana Pro", href: "/admin/nano-banana" },
    ],
  },
  { label: "Branding", href: "/admin/branding", icon: Palette, permission: "branding" },
  {
    label: "Z\u00E1kazn\u00EDci",
    icon: UserCheck,
    permission: "customers",
    children: [
      { label: "Segmentace RFM", href: "/admin/customers/segmentation" },
      { label: "Recenze", href: "/admin/customers/reviews" },
      { label: "Promo k\u00F3dy", href: "/admin/customers/promo-codes" },
    ],
  },
  {
    label: "Intelligence",
    icon: Eye,
    permission: "intelligence",
    children: [
      { label: "Konkurence", href: "/admin/intelligence/competitors" },
      { label: "Sez\u00F3nn\u00ED kalend\u00E1\u0159", href: "/admin/intelligence/seasonal" },
      { label: "Influence\u0159i", href: "/admin/intelligence/influencers" },
      { label: "UTM Builder", href: "/admin/intelligence/utm-builder" },
    ],
  },
  { label: "Activity Log", href: "/admin/activity-logs", icon: Activity, permission: "activity_logs" },
  { label: "U\u017Eivatel\u00E9", href: "/admin/users", icon: Users, permission: "users" },
  { label: "Nastaven\u00ED", href: "/admin/settings", icon: Settings, permission: "settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAdminAuth();
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isGroupActive = (children: { href: string }[]) =>
    children.some((child) => pathname.startsWith(child.href));

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold">QSPORT Marketing</h1>
        <p className="text-xs text-muted-foreground">qsport.cz</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {navigation.map((item) => {
          if (item.children) {
            const groupActive = isGroupActive(item.children);
            const isOpen = openGroups.includes(item.label) || groupActive;

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-accent transition-colors",
                    groupActive && "text-primary font-medium"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <ChevronDown
                    className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")}
                  />
                </button>
                {isOpen && (
                  <div className="ml-7 border-l border-border">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block px-4 py-1.5 text-sm hover:bg-accent transition-colors",
                          isActive(child.href)
                            ? "text-primary font-medium bg-accent"
                            : "text-muted-foreground"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors",
                isActive(item.href!)
                  ? "text-primary font-medium bg-accent"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Odhl\u00E1sit se
        </button>
      </div>
    </aside>
  );
}
