-- GenViral Integration Tables
-- Connected social accounts, slideshow metadata, per-account states, analytics

CREATE TABLE IF NOT EXISTS genviral_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  genviral_id TEXT UNIQUE NOT NULL,
  platform TEXT NOT NULL CHECK(platform IN ('tiktok', 'instagram', 'youtube', 'facebook', 'pinterest', 'linkedin')),
  username TEXT NOT NULL,
  display_name TEXT,
  profile_image_url TEXT,
  connected INTEGER NOT NULL DEFAULT 1,
  synced_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_gv_accounts_platform ON genviral_accounts(platform);

CREATE TABLE IF NOT EXISTS genviral_slideshows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  social_post_id INTEGER REFERENCES social_posts(id),
  image_urls TEXT NOT NULL, -- JSON array
  image_count INTEGER NOT NULL DEFAULT 0,
  aspect_ratio TEXT DEFAULT '9:16',
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'ready', 'failed')),
  genviral_post_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_gv_slideshows_post ON genviral_slideshows(social_post_id);

CREATE TABLE IF NOT EXISTS genviral_post_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  social_post_id INTEGER NOT NULL REFERENCES social_posts(id),
  genviral_account_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'publishing', 'published', 'failed')),
  external_post_id TEXT,
  error_message TEXT,
  published_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(social_post_id, genviral_account_id)
);

CREATE INDEX IF NOT EXISTS idx_gv_states_post ON genviral_post_states(social_post_id);

CREATE TABLE IF NOT EXISTS genviral_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  social_post_id INTEGER NOT NULL REFERENCES social_posts(id),
  genviral_account_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  fetched_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(social_post_id, genviral_account_id, fetched_at)
);

CREATE INDEX IF NOT EXISTS idx_gv_analytics_post ON genviral_analytics(social_post_id);
