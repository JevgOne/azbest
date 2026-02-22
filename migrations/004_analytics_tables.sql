-- Analytics and SEO tables
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  users INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  bounce_rate REAL DEFAULT 0,
  avg_session_duration REAL DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue REAL DEFAULT 0,
  top_pages TEXT, -- JSON
  traffic_sources TEXT, -- JSON
  device_breakdown TEXT, -- JSON
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_snapshots(date);

CREATE TABLE IF NOT EXISTS search_console_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  query TEXT,
  page TEXT,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr REAL DEFAULT 0,
  position REAL DEFAULT 0,
  device TEXT,
  country TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_sc_date ON search_console_data(date);
CREATE INDEX IF NOT EXISTS idx_sc_query ON search_console_data(query);

CREATE TABLE IF NOT EXISTS seo_audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  performance_score INTEGER DEFAULT 0,
  accessibility_score INTEGER DEFAULT 0,
  best_practices_score INTEGER DEFAULT 0,
  seo_score INTEGER DEFAULT 0,
  issues TEXT, -- JSON array
  opportunities TEXT, -- JSON array
  diagnostics TEXT, -- JSON
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS seo_keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL UNIQUE,
  target_url TEXT,
  current_position REAL,
  previous_position REAL,
  best_position REAL,
  search_volume INTEGER,
  difficulty INTEGER,
  tracking_enabled INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS seo_keyword_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword_id INTEGER NOT NULL REFERENCES seo_keywords(id),
  date TEXT NOT NULL,
  position REAL,
  url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(keyword_id, date)
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('weekly', 'monthly', 'custom')),
  title TEXT NOT NULL,
  date_from TEXT NOT NULL,
  date_to TEXT NOT NULL,
  data TEXT, -- JSON
  pdf_url TEXT,
  status TEXT DEFAULT 'generated',
  created_by TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
