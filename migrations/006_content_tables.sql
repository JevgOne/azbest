-- Content tables (Social, Blog, AI Images)
CREATE TABLE IF NOT EXISTS social_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL CHECK(platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok')),
  type TEXT DEFAULT 'post' CHECK(type IN ('post', 'story', 'reel', 'carousel')),
  content TEXT NOT NULL,
  media_urls TEXT, -- JSON array
  hashtags TEXT, -- JSON array
  link TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at INTEGER,
  published_at INTEGER,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  engagement_rate REAL DEFAULT 0,
  external_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_social_platform ON social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_scheduled ON social_posts(scheduled_at);

CREATE TABLE IF NOT EXISTS blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  category TEXT,
  tags TEXT, -- JSON array
  seo_title TEXT,
  seo_description TEXT,
  seo_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  author_id TEXT,
  published_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_posts(status);

CREATE TABLE IF NOT EXISTS generated_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt TEXT NOT NULL,
  style TEXT,
  dimensions TEXT DEFAULT '1024x1024',
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  model TEXT DEFAULT 'gemini-3-pro-image',
  category TEXT, -- product, banner, social, brand
  tags TEXT, -- JSON array
  used_in TEXT, -- JSON - where the image is used
  created_by TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
