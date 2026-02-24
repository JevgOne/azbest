"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { FileText, RotateCcw } from "lucide-react";
import { useState } from "react";

interface SocialPostRow {
  id: number;
  platform: string;
  content: string;
  status: string;
  scheduled_at: number | null;
  published_at: number | null;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  external_id: string | null;
  created_at: number;
}

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  pinterest: "Pinterest",
  linkedin: "LinkedIn",
  twitter: "Twitter",
};

export default function PostList() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["social-posts", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/social/posts?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as SocialPostRow[];
    },
  });

  const handleRetry = async (externalId: string) => {
    try {
      await fetch("/api/social/genviral/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIds: [externalId] }),
      });
      refetch();
    } catch (error) {
      console.error("Retry failed:", error);
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "—";
    return new Date(timestamp * 1000).toLocaleString("cs-CZ", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="mt-4 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtr dle stavu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny</SelectItem>
            <SelectItem value="draft">Koncepty</SelectItem>
            <SelectItem value="scheduled">Naplánované</SelectItem>
            <SelectItem value="published">Publikované</SelectItem>
            <SelectItem value="failed">Neúspěšné</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!data?.length ? (
        <EmptyState
          icon={FileText}
          title="Žádné příspěvky"
          description="Vytvořte první příspěvek pomocí tlačítka 'Nový příspěvek' výše."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platforma</TableHead>
                <TableHead>Obsah</TableHead>
                <TableHead>Stav</TableHead>
                <TableHead>Plánováno</TableHead>
                <TableHead className="text-right">Engagement</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <Badge variant="outline">
                      {PLATFORM_LABELS[post.platform] || post.platform}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="truncate text-sm">{post.content}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={post.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(post.scheduled_at)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {post.status === "published" ? (
                      <span>{post.likes} likes / {post.comments} komentářů</span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {post.status === "failed" && post.external_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetry(post.external_id!)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
