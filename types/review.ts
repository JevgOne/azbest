export interface Review {
  id: number;
  source: 'heureka' | 'google' | 'zbozi' | 'manual';
  external_id: string | null;
  author_name: string | null;
  author_email: string | null;
  rating: number;
  text: string | null;
  pros: string | null;
  cons: string | null;
  product_id: number | null;
  product_name: string | null;
  reply: string | null;
  replied_at: number | null;
  status: 'active' | 'hidden' | 'flagged';
  published_at: number | null;
  created_at: number;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  bySource: Record<string, { count: number; avgRating: number }>;
  unanswered: number;
}
