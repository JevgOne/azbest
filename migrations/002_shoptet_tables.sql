-- Shoptet integration tables
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
