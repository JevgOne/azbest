"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricCard } from "@/components/admin/MetricCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { Eye, Heart, MessageCircle, Share2, RefreshCw, BarChart3 } from "lucide-react";
import { useState } from "react";

interface PublishedPost {
  id: number;
  platform: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  published_at: number;
}

export default function AnalyticsSummary() {
  const [syncing, setSyncing] = useState(false);

  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ["social-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/social/posts?status=published&limit=50");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as PublishedPost[];
    },
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/social/genviral/analytics", { method: "POST" });
      await refetch();
    } finally {
      setSyncing(false);
    }
  };

  const totals = posts?.reduce(
    (acc, post) => ({
      views: acc.views + (post.impressions || 0),
      likes: acc.likes + (post.likes || 0),
      comments: acc.comments + (post.comments || 0),
      shares: acc.shares + (post.shares || 0),
    }),
    { views: 0, likes: 0, comments: 0, shares: 0 }
  ) || { views: 0, likes: 0, comments: 0, shares: 0 };

  if (isLoading) {
    return (
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          Synchronizovat analytiku
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Zhlédnutí" value={totals.views.toLocaleString("cs-CZ")} icon={Eye} />
        <MetricCard title="Lajky" value={totals.likes.toLocaleString("cs-CZ")} icon={Heart} />
        <MetricCard title="Komentáře" value={totals.comments.toLocaleString("cs-CZ")} icon={MessageCircle} />
        <MetricCard title="Sdílení" value={totals.shares.toLocaleString("cs-CZ")} icon={Share2} />
      </div>

      {!posts?.length ? (
        <EmptyState
          icon={BarChart3}
          title="Žádná analytika"
          description="Publikujte příspěvky přes GenViral a sledujte jejich výkon zde."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Příspěvek</TableHead>
                <TableHead className="text-right">Zhlédnutí</TableHead>
                <TableHead className="text-right">Lajky</TableHead>
                <TableHead className="text-right">Komentáře</TableHead>
                <TableHead className="text-right">Sdílení</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-[300px]">
                    <p className="truncate text-sm">{post.content}</p>
                  </TableCell>
                  <TableCell className="text-right">{post.impressions.toLocaleString("cs-CZ")}</TableCell>
                  <TableCell className="text-right">{post.likes.toLocaleString("cs-CZ")}</TableCell>
                  <TableCell className="text-right">{post.comments.toLocaleString("cs-CZ")}</TableCell>
                  <TableCell className="text-right">{post.shares.toLocaleString("cs-CZ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
