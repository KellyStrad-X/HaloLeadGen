/**
 * Seed script to populate database with test data
 * Run with: npx tsx database/seeds/seed.ts
 */

import { getDb, initializeSchema, generateUniqueSlug } from '../../lib/db';

function seed() {
  console.log('🌱 Seeding database...\n');

  const db = getDb();

  // Clear existing data (for fresh seed)
  console.log('Clearing existing data...');
  db.prepare('DELETE FROM photos').run();
  db.prepare('DELETE FROM leads').run();
  db.prepare('DELETE FROM campaigns').run();
  db.prepare('DELETE FROM contractors').run();
  console.log('✓ Existing data cleared\n');

  // Seed contractors
  console.log('Seeding contractors...');
  const contractor1 = db.prepare(`
    INSERT INTO contractors (name, company, email, phone)
    VALUES (?, ?, ?, ?)
  `).run(
    'John Smith',
    'Smith Roofing & Repair',
    'john@smithroofing.com',
    '214-555-0101'
  );

  const contractor2 = db.prepare(`
    INSERT INTO contractors (name, company, email, phone)
    VALUES (?, ?, ?, ?)
  `).run(
    'Maria Garcia',
    'Garcia Brothers Roofing',
    'maria@garciaroofing.com',
    '469-555-0202'
  );

  console.log(`✓ Created ${contractor1.changes + contractor2.changes} contractors\n`);

  // Seed campaigns
  console.log('Seeding campaigns...');

  const slug1 = generateUniqueSlug('Oak Ridge Subdivision Dallas TX');
  const campaign1 = db.prepare(`
    INSERT INTO campaigns (contractor_id, neighborhood_name, page_slug, status)
    VALUES (?, ?, ?, ?)
  `).run(contractor1.lastInsertRowid, 'Oak Ridge Subdivision, Dallas TX', slug1, 'active');

  const slug2 = generateUniqueSlug('Meadowbrook Heights Fort Worth TX');
  const campaign2 = db.prepare(`
    INSERT INTO campaigns (contractor_id, neighborhood_name, page_slug, status)
    VALUES (?, ?, ?, ?)
  `).run(contractor1.lastInsertRowid, 'Meadowbrook Heights, Fort Worth TX', slug2, 'active');

  const slug3 = generateUniqueSlug('Lakeside Village Plano TX');
  const campaign3 = db.prepare(`
    INSERT INTO campaigns (contractor_id, neighborhood_name, page_slug, status)
    VALUES (?, ?, ?, ?)
  `).run(contractor2.lastInsertRowid, 'Lakeside Village, Plano TX', slug3, 'active');

  console.log(`✓ Created 3 campaigns`);
  console.log(`  - Campaign 1: ${slug1}`);
  console.log(`  - Campaign 2: ${slug2}`);
  console.log(`  - Campaign 3: ${slug3}\n`);

  // Seed photos for campaign 1
  console.log('Seeding photos...');
  const photoInsert = db.prepare(`
    INSERT INTO photos (campaign_id, image_path, upload_order)
    VALUES (?, ?, ?)
  `);

  photoInsert.run(campaign1.lastInsertRowid, '/uploads/campaigns/1/roof-damage-1.jpg', 1);
  photoInsert.run(campaign1.lastInsertRowid, '/uploads/campaigns/1/roof-damage-2.jpg', 2);
  photoInsert.run(campaign1.lastInsertRowid, '/uploads/campaigns/1/roof-damage-3.jpg', 3);
  photoInsert.run(campaign1.lastInsertRowid, '/uploads/campaigns/1/roof-damage-4.jpg', 4);
  photoInsert.run(campaign1.lastInsertRowid, '/uploads/campaigns/1/roof-damage-5.jpg', 5);

  photoInsert.run(campaign2.lastInsertRowid, '/uploads/campaigns/2/hail-damage-1.jpg', 1);
  photoInsert.run(campaign2.lastInsertRowid, '/uploads/campaigns/2/hail-damage-2.jpg', 2);
  photoInsert.run(campaign2.lastInsertRowid, '/uploads/campaigns/2/hail-damage-3.jpg', 3);

  console.log('✓ Created 8 photos for campaigns\n');

  // Seed leads
  console.log('Seeding leads...');
  const leadInsert = db.prepare(`
    INSERT INTO leads (campaign_id, name, address, email, phone, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  leadInsert.run(
    campaign1.lastInsertRowid,
    'Sarah Johnson',
    '123 Oak Street, Dallas TX 75001',
    'sarah.johnson@email.com',
    '214-555-1234',
    'Noticed some missing shingles after last storm',
    'new'
  );

  leadInsert.run(
    campaign1.lastInsertRowid,
    'Michael Chen',
    '456 Oak Avenue, Dallas TX 75001',
    'mchen@email.com',
    '214-555-5678',
    'Water stains in attic',
    'contacted'
  );

  leadInsert.run(
    campaign1.lastInsertRowid,
    'Emily Rodriguez',
    '789 Oak Boulevard, Dallas TX 75001',
    'emily.r@email.com',
    '214-555-9012',
    null,
    'new'
  );

  leadInsert.run(
    campaign2.lastInsertRowid,
    'David Williams',
    '321 Meadow Lane, Fort Worth TX 76110',
    'dwilliams@email.com',
    '817-555-3456',
    'Hail damage from last week',
    'new'
  );

  leadInsert.run(
    campaign3.lastInsertRowid,
    'Lisa Martinez',
    '654 Lake Drive, Plano TX 75074',
    'lmartinez@email.com',
    '972-555-7890',
    'Need inspection before selling house',
    'qualified'
  );

  console.log('✓ Created 5 leads\n');

  // Print summary
  console.log('═══════════════════════════════════════');
  console.log('✓ Database seeded successfully!');
  console.log('═══════════════════════════════════════');
  console.log(`Contractors: 2`);
  console.log(`Campaigns: 3`);
  console.log(`Photos: 8`);
  console.log(`Leads: 5`);
  console.log('═══════════════════════════════════════\n');

  // Print test URLs
  console.log('Test landing page URLs:');
  console.log(`  http://localhost:3000/c/${slug1}`);
  console.log(`  http://localhost:3000/c/${slug2}`);
  console.log(`  http://localhost:3000/c/${slug3}`);
  console.log('\n');
}

// Run seed if executed directly
if (require.main === module) {
  try {
    initializeSchema();
    seed();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

export default seed;
