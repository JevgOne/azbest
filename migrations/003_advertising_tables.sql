-- Advertising platform tables
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL CHECK(platform IN ('google_ads', 'meta_ads', 'sklik', 'heureka', 'zbozi', 'mergado')),
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  campaign_type TEXT,
  daily_budget REAL,
  total_budget REAL,
  currency TEXT DEFAULT 'CZK',
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend REAL DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue REAL DEFAULT 0,
  roas REAL DEFAULT 0,
  ctr REAL DEFAULT 0,
  cpc REAL DEFAULT 0,
  start_date INTEGER,
  end_date INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  synced_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(platform, external_id)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_platform ON ad_campaigns(platform);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON ad_campaigns(status);

CREATE TABLE IF NOT EXISTS campaign_daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL REFERENCES ad_campaigns(id),
  date TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend REAL DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue REAL DEFAULT 0,
  ctr REAL DEFAULT 0,
  cpc REAL DEFAULT 0,
  roas REAL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(campaign_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON campaign_daily_stats(date);

CREATE TABLE IF NOT EXISTS ad_keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER REFERENCES ad_campaigns(id),
  platform TEXT NOT NULL,
  keyword TEXT NOT NULL,
  match_type TEXT DEFAULT 'broad',
  status TEXT DEFAULT 'active',
  bid REAL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend REAL DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  quality_score INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS ad_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  campaign_id INTEGER REFERENCES ad_campaigns(id),
  type TEXT NOT NULL, -- budget, keyword, targeting, creative
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_impact TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'applied', 'dismissed')),
  ai_generated INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS product_feeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL, -- heureka, zbozi, mergado, google_shopping
  name TEXT NOT NULL,
  url TEXT,
  format TEXT DEFAULT 'xml',
  products_count INTEGER DEFAULT 0,
  last_generated_at INTEGER,
  status TEXT DEFAULT 'active',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS product_feed_bids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_id INTEGER REFERENCES product_feeds(id),
  product_id INTEGER REFERENCES products(id),
  bid REAL NOT NULL,
  max_cpc REAL,
  status TEXT DEFAULT 'active',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
