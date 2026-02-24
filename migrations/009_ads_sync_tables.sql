-- Migration 009: ADS Sync Infrastructure
-- Sync log, missing tables for heureka bids, mergado, UTM mapping

-- Track all sync operations across platforms
CREATE TABLE IF NOT EXISTS ad_sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL CHECK(platform IN ('google_ads', 'meta_ads', 'sklik', 'heureka', 'zbozi', 'mergado')),
  sync_type TEXT NOT NULL CHECK(sync_type IN ('campaigns', 'daily_stats', 'keywords', 'feeds', 'reviews', 'full')),
  status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running', 'completed', 'failed')),
  campaigns_synced INTEGER DEFAULT 0,
  stats_synced INTEGER DEFAULT 0,
  error_message TEXT,
  date_from TEXT,
  date_to TEXT,
  started_at INTEGER NOT NULL DEFAULT (unixepoch()),
  completed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sync_log_platform ON ad_sync_log(platform);
CREATE INDEX IF NOT EXISTS idx_sync_log_started ON ad_sync_log(started_at DESC);

-- Heureka product bids (extends product_feed_bids with heureka-specific fields)
CREATE TABLE IF NOT EXISTS heureka_bids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER REFERENCES products(id),
  product_name TEXT NOT NULL,
  category TEXT,
  current_bid REAL NOT NULL DEFAULT 0,
  max_cpc REAL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend REAL DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue REAL DEFAULT 0,
  active INTEGER DEFAULT 1,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_heureka_bids_product ON heureka_bids(product_id);

-- Mergado feeds
CREATE TABLE IF NOT EXISTS mergado_feeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mergado_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  format TEXT DEFAULT 'xml',
  url TEXT,
  products_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  last_rebuild_at INTEGER,
  synced_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Mergado rules
CREATE TABLE IF NOT EXISTS mergado_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_id INTEGER NOT NULL REFERENCES mergado_feeds(id),
  mergado_rule_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'active',
  priority INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(feed_id, mergado_rule_id)
);

CREATE INDEX IF NOT EXISTS idx_mergado_rules_feed ON mergado_rules(feed_id);

-- UTM to ad campaign mapping for ROAS calculation
CREATE TABLE IF NOT EXISTS utm_ad_mapping (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  campaign_id INTEGER REFERENCES ad_campaigns(id),
  utm_source TEXT NOT NULL,
  utm_medium TEXT NOT NULL,
  utm_campaign TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(utm_source, utm_medium, utm_campaign)
);

CREATE INDEX IF NOT EXISTS idx_utm_mapping_campaign ON utm_ad_mapping(campaign_id);
CREATE INDEX IF NOT EXISTS idx_utm_mapping_source ON utm_ad_mapping(utm_source, utm_medium, utm_campaign);
