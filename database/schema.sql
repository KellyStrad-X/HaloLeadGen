-- Halo Lead Generation Database Schema
-- SQLite version (for development)
-- PostgreSQL compatible (for production)

-- ============================================
-- CONTRACTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contractors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CAMPAIGNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contractor_id INTEGER NOT NULL,
  neighborhood_name TEXT NOT NULL,
  page_slug TEXT UNIQUE NOT NULL,
  qr_code_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed')),
  FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE
);

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'qualified', 'closed', 'lost')),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- ============================================
-- PHOTOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  image_path TEXT NOT NULL,
  upload_order INTEGER NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_campaigns_contractor ON campaigns(contractor_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(page_slug);
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_email_campaign ON leads(email, campaign_id);
CREATE INDEX IF NOT EXISTS idx_photos_campaign ON photos(campaign_id);
CREATE INDEX IF NOT EXISTS idx_photos_order ON photos(campaign_id, upload_order);

-- ============================================
-- NOTES
-- ============================================
-- 1. SQLite uses INTEGER PRIMARY KEY AUTOINCREMENT
--    PostgreSQL uses SERIAL or BIGSERIAL
--
-- 2. SQLite uses DATETIME, PostgreSQL uses TIMESTAMP
--
-- 3. When migrating to PostgreSQL, adjust types:
--    - INTEGER -> BIGINT or SERIAL
--    - DATETIME -> TIMESTAMP
--    - TEXT -> VARCHAR or TEXT
--
-- 4. Foreign keys must be enabled in SQLite:
--    PRAGMA foreign_keys = ON;
