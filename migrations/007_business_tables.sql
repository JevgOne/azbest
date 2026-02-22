-- Business tables (Branding, Reviews, Promo, Competitors, Seasonal, Influencers, UTM)
CREATE TABLE IF NOT EXISTS brand_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('logo', 'icon', 'banner', 'photo', 'video', 'font', 'color', 'guideline')),
  file_url TEXT,
  thumbnail_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  dimensions TEXT,
  metadata TEXT, -- JSON
  tags TEXT, -- JSON array
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL CHECK(source IN ('heureka', 'google', 'zbozi', 'manual')),
  external_id TEXT,
  author_name TEXT,
  author_email TEXT,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  text TEXT,
  pros TEXT,
  cons TEXT,
  product_id INTEGER REFERENCES products(id),
  product_name TEXT,
  reply TEXT,
  replied_at INTEGER,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'hidden', 'flagged')),
  published_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_source ON reviews(source);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

CREATE TABLE IF NOT EXISTS promo_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK(type IN ('percentage', 'fixed', 'free_shipping')),
  value REAL NOT NULL,
  min_order_value REAL,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from INTEGER,
  valid_to INTEGER,
  target_segment TEXT,
  shoptet_synced INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS competitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  brands TEXT, -- JSON array
  categories TEXT, -- JSON array
  monitoring_enabled INTEGER DEFAULT 1,
  last_checked_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS competitor_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  competitor_id INTEGER NOT NULL REFERENCES competitors(id),
  product_name TEXT NOT NULL,
  product_url TEXT,
  our_product_id INTEGER REFERENCES products(id),
  competitor_price REAL NOT NULL,
  our_price REAL,
  price_difference REAL,
  currency TEXT DEFAULT 'CZK',
  checked_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_comp_prices_competitor ON competitor_prices(competitor_id);

CREATE TABLE IF NOT EXISTS seasonal_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('sport_season', 'holiday', 'sale', 'event', 'custom')),
  description TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  categories TEXT, -- JSON array of relevant categories
  brands TEXT, -- JSON array of relevant brands
  marketing_actions TEXT, -- JSON array
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'planned' CHECK(status IN ('planned', 'active', 'completed')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS influencers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  handle TEXT,
  platform TEXT NOT NULL CHECK(platform IN ('instagram', 'youtube', 'tiktok', 'facebook', 'blog')),
  followers INTEGER DEFAULT 0,
  engagement_rate REAL DEFAULT 0,
  sport TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'prospect' CHECK(status IN ('prospect', 'contacted', 'active', 'inactive')),
  cost_per_post REAL,
  total_spent REAL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS influencer_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  influencer_id INTEGER NOT NULL REFERENCES influencers(id),
  platform TEXT NOT NULL,
  post_url TEXT,
  content TEXT,
  post_type TEXT, -- post, story, reel, video
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue REAL DEFAULT 0,
  cost REAL DEFAULT 0,
  posted_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS utm_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  source TEXT NOT NULL,
  medium TEXT NOT NULL,
  campaign TEXT NOT NULL,
  content TEXT,
  term TEXT,
  url TEXT NOT NULL,
  generated_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue REAL DEFAULT 0,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_utm_source ON utm_campaigns(source);
CREATE INDEX IF NOT EXISTS idx_utm_campaign ON utm_campaigns(campaign);
