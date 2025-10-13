/**
 * Database connection and utilities
 * Uses SQLite for development, designed for easy PostgreSQL migration
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Database file path
const DB_PATH = path.join(process.cwd(), 'database', 'halo.db');
const SCHEMA_PATH = path.join(process.cwd(), 'database', 'schema.sql');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
let db: Database.Database | null = null;

/**
 * Get database connection (singleton pattern)
 */
export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);

    // Enable foreign keys (important for SQLite)
    db.pragma('foreign_keys = ON');

    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');

    console.log('✓ Database connected:', DB_PATH);
  }

  return db;
}

/**
 * Initialize database schema
 * Reads schema.sql and executes it
 */
export function initializeSchema(): void {
  const db = getDb();

  // Read schema SQL file
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');

  // Execute schema (split by semicolon to handle multiple statements)
  db.exec(schema);

  console.log('✓ Database schema initialized');
}

/**
 * Check if database is initialized (has tables)
 */
export function isDatabaseInitialized(): boolean {
  const db = getDb();

  const result = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='contractors'
  `).get();

  return !!result;
}

/**
 * Close database connection
 * Call this when shutting down the application
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
    console.log('✓ Database connection closed');
  }
}

/**
 * Type definitions for database tables
 */

export interface Contractor {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface Campaign {
  id: number;
  contractor_id: number;
  neighborhood_name: string;
  page_slug: string;
  qr_code_path: string | null;
  created_at: string;
  status: 'active' | 'paused' | 'completed';
}

export interface Lead {
  id: number;
  campaign_id: number;
  name: string;
  address: string;
  email: string;
  phone: string;
  notes: string | null;
  submitted_at: string;
  status: 'new' | 'contacted' | 'qualified' | 'closed' | 'lost';
}

export interface Photo {
  id: number;
  campaign_id: number;
  image_path: string;
  upload_order: number;
  uploaded_at: string;
}

/**
 * Helper: Generate URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Helper: Check if slug is unique
 */
export function isSlugUnique(slug: string): boolean {
  const db = getDb();
  const result = db.prepare('SELECT id FROM campaigns WHERE page_slug = ?').get(slug);
  return !result;
}

/**
 * Helper: Generate unique slug
 */
export function generateUniqueSlug(text: string): string {
  let slug = generateSlug(text);
  let counter = 1;

  while (!isSlugUnique(slug)) {
    slug = `${generateSlug(text)}-${counter}`;
    counter++;
  }

  return slug;
}
