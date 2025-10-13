/**
 * Database initialization script
 * Run with: npx tsx database/init.ts
 *
 * This script:
 * 1. Creates the database file
 * 2. Initializes the schema
 * 3. Optionally seeds with test data
 */

import { initializeSchema, isDatabaseInitialized } from '../lib/db';
import seed from './seeds/seed';

async function init() {
  console.log('🚀 Initializing Halo database...\n');

  try {
    // Check if already initialized
    if (isDatabaseInitialized()) {
      console.log('⚠️  Database already initialized');
      console.log('To reset, delete database/halo.db and run again\n');

      // Ask if user wants to re-seed
      const args = process.argv.slice(2);
      if (args.includes('--seed') || args.includes('-s')) {
        console.log('Re-seeding database...\n');
        seed();
      }
      return;
    }

    // Initialize schema
    console.log('Creating database schema...');
    initializeSchema();
    console.log('✓ Schema created successfully\n');

    // Seed data if requested
    const args = process.argv.slice(2);
    if (args.includes('--seed') || args.includes('-s')) {
      seed();
    } else {
      console.log('💡 Run with --seed flag to populate test data');
      console.log('   Example: npx tsx database/init.ts --seed\n');
    }

    console.log('✅ Database initialization complete!\n');

  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  init();
}

export default init;
