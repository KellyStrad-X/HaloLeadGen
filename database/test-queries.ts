/**
 * Test database queries
 * Run with: npx tsx database/test-queries.ts
 */

import { getDb, type Campaign, type Lead, type Contractor } from '../lib/db';

function testQueries() {
  console.log('🧪 Testing database queries...\n');

  const db = getDb();

  // Test 1: Get all contractors
  console.log('Test 1: Get all contractors');
  const contractors = db.prepare('SELECT * FROM contractors').all() as Contractor[];
  console.log(`✓ Found ${contractors.length} contractors:`);
  contractors.forEach(c => console.log(`  - ${c.name} (${c.company})`));
  console.log('');

  // Test 2: Get all campaigns
  console.log('Test 2: Get all campaigns');
  const campaigns = db.prepare('SELECT * FROM campaigns').all() as Campaign[];
  console.log(`✓ Found ${campaigns.length} campaigns:`);
  campaigns.forEach(c => console.log(`  - ${c.neighborhood_name} (/${c.page_slug})`));
  console.log('');

  // Test 3: Get campaign with photos
  console.log('Test 3: Get campaign with photos (JOIN query)');
  const campaignWithPhotos = db.prepare(`
    SELECT
      c.id, c.neighborhood_name, c.page_slug,
      COUNT(p.id) as photo_count
    FROM campaigns c
    LEFT JOIN photos p ON c.id = p.campaign_id
    WHERE c.id = 1
    GROUP BY c.id
  `).get();
  console.log('✓ Campaign with photos:', campaignWithPhotos);
  console.log('');

  // Test 4: Get all leads for a campaign
  console.log('Test 4: Get leads for campaign 1');
  const leads = db.prepare(`
    SELECT * FROM leads WHERE campaign_id = 1
  `).all() as Lead[];
  console.log(`✓ Found ${leads.length} leads:`);
  leads.forEach(l => console.log(`  - ${l.name} (${l.email}) - Status: ${l.status}`));
  console.log('');

  // Test 5: Get campaign with contractor info
  console.log('Test 5: Get campaign with contractor (JOIN query)');
  const campaignWithContractor = db.prepare(`
    SELECT
      c.id, c.neighborhood_name, c.page_slug,
      co.name as contractor_name, co.email as contractor_email
    FROM campaigns c
    JOIN contractors co ON c.contractor_id = co.id
    WHERE c.id = 1
  `).get();
  console.log('✓ Campaign with contractor:', campaignWithContractor);
  console.log('');

  // Test 6: Count statistics
  console.log('Test 6: Database statistics');
  const stats = {
    contractors: db.prepare('SELECT COUNT(*) as count FROM contractors').get() as { count: number },
    campaigns: db.prepare('SELECT COUNT(*) as count FROM campaigns').get() as { count: number },
    leads: db.prepare('SELECT COUNT(*) as count FROM leads').get() as { count: number },
    photos: db.prepare('SELECT COUNT(*) as count FROM photos').get() as { count: number },
  };
  console.log('✓ Database stats:');
  console.log(`  - Contractors: ${stats.contractors.count}`);
  console.log(`  - Campaigns: ${stats.campaigns.count}`);
  console.log(`  - Leads: ${stats.leads.count}`);
  console.log(`  - Photos: ${stats.photos.count}`);
  console.log('');

  // Test 7: Test slug lookup (important for landing pages)
  console.log('Test 7: Look up campaign by slug');
  const slug = 'oak-ridge-subdivision-dallas-tx';
  const campaign = db.prepare(`
    SELECT * FROM campaigns WHERE page_slug = ?
  `).get(slug) as Campaign;
  console.log(`✓ Found campaign for slug "${slug}":`, campaign?.neighborhood_name);
  console.log('');

  console.log('✅ All tests passed!\n');
}

// Run tests if executed directly
if (require.main === module) {
  try {
    testQueries();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

export default testQueries;
