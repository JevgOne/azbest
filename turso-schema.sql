-- ============================================================
-- QSport Marketing - Complete Database Schema for Turso
-- Combined from all migration files
-- ============================================================

-- ============================================================
-- Migration 001: Initial Schema
-- Core tables: admins, activity_logs, settings
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('owner', 'admin', 'specialist')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  details TEXT,
  ip_address TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================
-- Migration 002: Shoptet Tables
-- Shoptet integration tables
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shoptet_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  brand TEXT,
  category TEXT,
  subcategory TEXT,
  price REAL NOT NULL DEFAULT 0,
  price_before_discount REAL,
  currency TEXT DEFAULT 'CZK',
  stock INTEGER DEFAULT 0,
  ean TEXT,
  sku TEXT,
  weight REAL,
  description TEXT,
  short_description TEXT,
  images TEXT, -- JSON array
  variants TEXT, -- JSON array
  parameters TEXT, -- JSON object
  visibility TEXT DEFAULT 'visible',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  synced_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_shoptet ON products(shoptet_id);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shoptet_id TEXT UNIQUE NOT NULL,
  order_number TEXT NOT NULL,
  customer_email TEXT,
  customer_name TEXT,
  status TEXT NOT NULL,
  payment_method TEXT,
  shipping_method TEXT,
  total_price REAL NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'CZK',
  items TEXT, -- JSON array
  billing_address TEXT, -- JSON
  shipping_address TEXT, -- JSON
  notes TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  synced_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shoptet_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent REAL DEFAULT 0,
  first_order_at INTEGER,
  last_order_at INTEGER,
  rfm_recency INTEGER,
  rfm_frequency INTEGER,
  rfm_monetary INTEGER,
  rfm_segment TEXT,
  rfm_score TEXT,
  sport_interests TEXT, -- JSON array
  tags TEXT, -- JSON array
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(rfm_segment);

CREATE TABLE IF NOT EXISTS abandoned_carts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  customer_email TEXT,
  customer_name TEXT,
  items TEXT NOT NULL, -- JSON array
  total_price REAL DEFAULT 0,
  currency TEXT DEFAULT 'CZK',
  recovered INTEGER DEFAULT 0,
  recovery_email_sent INTEGER DEFAULT 0,
  abandoned_at INTEGER NOT NULL DEFAULT (unixepoch()),
  recovered_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_abandoned_email ON abandoned_carts(customer_email);
CREATE INDEX IF NOT EXISTS idx_abandoned_recovered ON abandoned_carts(recovered);

CREATE TABLE IF NOT EXISTS sync_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL, -- products, orders, customers
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  items_synced INTEGER DEFAULT 0,
  items_total INTEGER DEFAULT 0,
  error_message TEXT,
  started_at INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================
-- Migration 003: Advertising Tables
-- Advertising platform tables
-- ============================================================

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL CHECK(platform IN ('google_ads', 'meta_ads', 'sklik', 'heureka', 'zbozi')),
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

-- ============================================================
-- Migration 004: Analytics Tables
-- Analytics and SEO tables
-- ============================================================

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

-- ============================================================
-- Migration 005: Communication Tables
-- Communication tables (Email, Push, SMS)
-- ============================================================

CREATE TABLE IF NOT EXISTS email_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ecomail_id TEXT,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_id TEXT,
  list_id TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  unsubscribe_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  open_rate REAL DEFAULT 0,
  click_rate REAL DEFAULT 0,
  scheduled_at INTEGER,
  sent_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS push_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT,
  icon TEXT,
  image TEXT,
  segment TEXT, -- target segment
  sent_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'scheduled', 'sent', 'failed')),
  scheduled_at INTEGER,
  sent_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT UNIQUE NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  user_agent TEXT,
  customer_email TEXT,
  active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS sms_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  sender TEXT,
  recipients TEXT, -- JSON array of phone numbers
  segment TEXT,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at INTEGER,
  sent_at INTEGER,
  cost REAL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================
-- Migration 006: Content Tables
-- Content tables (Social, Blog, AI Images)
-- ============================================================

CREATE TABLE IF NOT EXISTS social_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL CHECK(platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'pinterest', 'youtube')),
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

-- ============================================================
-- Migration 007: Business Tables
-- Business tables (Branding, Reviews, Promo, Competitors, Seasonal, Influencers, UTM)
-- ============================================================

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

-- ============================================================
-- Migration 008: GenViral Integration Tables
-- Connected social accounts, slideshow metadata, per-account states, analytics
-- ============================================================

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
