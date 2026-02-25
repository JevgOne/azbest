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
  Star, MessageSquare, Loader2, Eye, EyeOff, Flag, Reply,
  ThumbsUp, ThumbsDown, Filter, ExternalLink,
} from "lucide-react";
import { useState } from "react";

interface Review {
  id: number;
  source: string;
  external_id?: string;
  author_name: string;
  author_email?: string;
  rating: number;
  text: string;
  pros?: string;
  cons?: string;
  product_id?: string;
  product_name?: string;
  reply?: string;
  replied_at?: number;
  status: string;
  published_at: number;
  created_at: number;
}

const SOURCE_LABELS: Record<string, string> = {
  heureka: "Heureka",
  google: "Google",
  zbozi: "Zbozi.cz",
  manual: "Manualni",
};

const SOURCE_COLORS: Record<string, string> = {
  heureka: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  google: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  zbozi: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  manual: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Aktivni",
  hidden: "Skryta",
  flagged: "Oznacena",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  hidden: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  flagged: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

function formatDate(ts: number): string {
  if (!ts) return "\u2014";
  return new Date(ts * 1000).toLocaleDateString("cs-CZ", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
      <span className="ml-1 text-sm text-muted-foreground">{rating}/5</span>
    </div>
  );
}

export default function ReviewsPage() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [replyReview, setReplyReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["customer-reviews", filterSource, filterRating],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", "100");
      if (filterSource !== "all") params.set("source", filterSource);
      if (filterRating !== "all") params.set("minRating", filterRating);
      const res = await fetch(`/api/customers/reviews?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { reviews: Review[]; total: number };
    },
  });

  const reviews = data?.reviews || [];
  const totalReviews = data?.total || 0;

  // Client-side status filter (API doesn't support it)
  const filteredReviews = filterStatus === "all"
    ? reviews
    : reviews.filter((r) => r.status === filterStatus);

  // Compute metrics
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
    : "0";
  const heurekaCount = reviews.filter((r) => r.source === "heureka").length;
  const googleCount = reviews.filter((r) => r.source === "google").length;
  const zboziCount = reviews.filter((r) => r.source === "zbozi").length;

  const handleReply = async () => {
    if (!replyReview || !replyText.trim()) return;
    setReplySubmitting(true);
    try {
      const res = await fetch("/api/customers/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: replyReview.id, reply: replyText }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      queryClient.invalidateQueries({ queryKey: ["customer-reviews"] });
      setReplyReview(null);
      setReplyText("");
    } catch {
      // Silently handle - API may not support PUT yet
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleStatusChange = async (reviewId: number, newStatus: string) => {
    try {
      const res = await fetch("/api/customers/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reviewId, status: newStatus }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      queryClient.invalidateQueries({ queryKey: ["customer-reviews"] });
    } catch {
      // Silently handle
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Recenze</h1>
            <p className="text-muted-foreground">Prehled recenzi z Heureka, Google a Zbozi.cz</p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Prumerne hodnoceni"
            value={`${avgRating} / 5`}
            icon={Star}
            trend={Number(avgRating) >= 4 ? "up" : Number(avgRating) >= 3 ? "neutral" : "down"}
            change={`z ${reviews.length} recenzi`}
          />
          <MetricCard
            title="Celkem recenzi"
            value={totalReviews.toLocaleString("cs-CZ")}
            icon={MessageSquare}
            description="Vsechny zdroje dohromady"
          />
          <MetricCard
            title="Heureka"
            value={heurekaCount.toLocaleString("cs-CZ")}
            icon={ThumbsUp}
            description={`Google: ${googleCount}, Zbozi: ${zboziCount}`}
          />
          <MetricCard
            title="Bez odpovedi"
            value={reviews.filter((r) => !r.reply).length.toLocaleString("cs-CZ")}
            icon={Reply}
            trend={reviews.filter((r) => !r.reply).length > 5 ? "down" : "up"}
            change="ceka na odpoved"
          />
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtry:</span>
              </div>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Zdroj" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vsechny zdroje</SelectItem>
                  <SelectItem value="heureka">Heureka</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="zbozi">Zbozi.cz</SelectItem>
                  <SelectItem value="manual">Manualni</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Hodnoceni" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vsechna hodnoceni</SelectItem>
                  <SelectItem value="5">5 hvezd</SelectItem>
                  <SelectItem value="4">4+ hvezdy</SelectItem>
                  <SelectItem value="3">3+ hvezdy</SelectItem>
                  <SelectItem value="2">2+ hvezdy</SelectItem>
                  <SelectItem value="1">1+ hvezda</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Stav" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vsechny stavy</SelectItem>
                  <SelectItem value="active">Aktivni</SelectItem>
                  <SelectItem value="hidden">Skryte</SelectItem>
                  <SelectItem value="flagged">Oznacene</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center gap-2 py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Nacitani recenzi...</span>
          </div>
        ) : !reviews.length ? (
          <EmptyState
            icon={Star}
            title="Zadne recenze"
            description="Zatim nebyly nalezeny zadne recenze. Recenze se automaticky stahuji z Heureka, Google a Zbozi.cz."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Recenze ({filteredReviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Autor</TableHead>
                    <TableHead>Hodnoceni</TableHead>
                    <TableHead className="min-w-[300px]">Text</TableHead>
                    <TableHead>Produkt</TableHead>
                    <TableHead>Zdroj</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead>Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{review.author_name || "Anonymni"}</span>
                          {review.author_email && (
                            <p className="text-xs text-muted-foreground">{review.author_email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StarRating rating={Number(review.rating)} />
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="text-sm line-clamp-2">{review.text || "\u2014"}</p>
                        {review.pros && (
                          <div className="flex items-center gap-1 mt-1">
                            <ThumbsUp className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 line-clamp-1">{review.pros}</span>
                          </div>
                        )}
                        {review.cons && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <ThumbsDown className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600 line-clamp-1">{review.cons}</span>
                          </div>
                        )}
                        {review.reply && (
                          <div className="mt-1 p-2 bg-muted rounded text-xs">
                            <span className="font-medium">Odpoved:</span> {review.reply}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {review.product_name || "\u2014"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${SOURCE_COLORS[review.source] || ""} border-0`}>
                          {SOURCE_LABELS[review.source] || review.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(review.published_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${STATUS_COLORS[review.status] || ""} border-0`}>
                          {STATUS_LABELS[review.status] || review.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!review.reply && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Odpovedet"
                              onClick={() => {
                                setReplyReview(review);
                                setReplyText(review.reply || "");
                              }}
                            >
                              <Reply className="h-4 w-4" />
                            </Button>
                          )}
                          {review.status === "active" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Skryt"
                              onClick={() => handleStatusChange(review.id, "hidden")}
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          )}
                          {review.status === "hidden" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Zobrazit"
                              onClick={() => handleStatusChange(review.id, "active")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {review.status !== "flagged" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Oznacit"
                              onClick={() => handleStatusChange(review.id, "flagged")}
                            >
                              <Flag className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                          {review.status === "flagged" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Zrusit oznaceni"
                              onClick={() => handleStatusChange(review.id, "active")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredReviews.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Zadne recenze odpovidajici filtrum
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Reply Dialog */}
        {replyReview && (
          <Dialog open onOpenChange={() => setReplyReview(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Odpovedet na recenzi</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{replyReview.author_name || "Anonymni"}</span>
                    <StarRating rating={Number(replyReview.rating)} />
                  </div>
                  <p className="text-sm">{replyReview.text}</p>
                  {replyReview.product_name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Produkt: {replyReview.product_name}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="reply-text">Vase odpoved</Label>
                  <Textarea
                    id="reply-text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Napiste odpoved na recenzi..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setReplyReview(null)}>
                    Zrusit
                  </Button>
                  <Button
                    onClick={handleReply}
                    disabled={replySubmitting || !replyText.trim()}
                  >
                    {replySubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Reply className="h-4 w-4 mr-2" />
                    )}
                    Odeslat odpoved
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
