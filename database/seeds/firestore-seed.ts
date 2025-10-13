/**
 * Firestore Seed Data Script
 * Populates Firestore with sample contractors, campaigns, and photos
 *
 * Usage (from project root):
 *   npx tsx database/seeds/firestore-seed.ts
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate config
if (!firebaseConfig.projectId) {
  console.error('❌ Error: Firebase configuration not found in .env.local');
  console.error('Please ensure all NEXT_PUBLIC_FIREBASE_* variables are set');
  process.exit(1);
}

// Initialize Firebase (client SDK for local development)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

console.log(`✓ Firebase initialized with project: ${firebaseConfig.projectId}\n`);

async function seedFirestore() {
  console.log('🌱 Starting Firestore seeding...\n');

  try {
    // ===== 1. SEED CONTRACTORS =====
    console.log('📝 Seeding contractors...');

    const contractor1Ref = await addDoc(collection(db, 'contractors'), {
      name: 'John Smith',
      company: 'Smith Roofing & Repair',
      email: 'john@smithroofing.com',
      phone: '(214) 555-0123',
      createdAt: Timestamp.now(),
    });
    console.log('  ✓ Added contractor: Smith Roofing & Repair');

    const contractor2Ref = await addDoc(collection(db, 'contractors'), {
      name: 'Sarah Johnson',
      company: 'DFW Elite Roofing',
      email: 'sarah@dfweliteroofing.com',
      phone: '(817) 555-0456',
      createdAt: Timestamp.now(),
    });
    console.log('  ✓ Added contractor: DFW Elite Roofing\n');

    // ===== 2. SEED CAMPAIGNS =====
    console.log('📝 Seeding campaigns...');

    const campaign1Ref = await addDoc(collection(db, 'campaigns'), {
      contractorId: contractor1Ref.id,
      neighborhoodName: 'Oak Ridge Subdivision, Dallas TX',
      pageSlug: 'oak-ridge-subdivision-dallas-tx',
      qrCodeUrl: null, // Will be generated in Sprint 3
      createdAt: Timestamp.now(),
      status: 'active',
    });
    console.log('  ✓ Added campaign: Oak Ridge Subdivision, Dallas TX');

    const campaign2Ref = await addDoc(collection(db, 'campaigns'), {
      contractorId: contractor1Ref.id,
      neighborhoodName: 'Meadowbrook Heights, Fort Worth TX',
      pageSlug: 'meadowbrook-heights-fort-worth-tx',
      qrCodeUrl: null,
      createdAt: Timestamp.now(),
      status: 'active',
    });
    console.log('  ✓ Added campaign: Meadowbrook Heights, Fort Worth TX');

    const campaign3Ref = await addDoc(collection(db, 'campaigns'), {
      contractorId: contractor2Ref.id,
      neighborhoodName: 'Lakeside Village, Plano TX',
      pageSlug: 'lakeside-village-plano-tx',
      qrCodeUrl: null,
      createdAt: Timestamp.now(),
      status: 'active',
    });
    console.log('  ✓ Added campaign: Lakeside Village, Plano TX\n');

    // ===== 3. SEED PHOTOS =====
    console.log('📝 Seeding photos...');

    // Photos for Campaign 1 (Oak Ridge)
    await addDoc(collection(db, 'photos'), {
      campaignId: campaign1Ref.id,
      imageUrl: '/uploads/campaigns/oak-ridge-dallas/photo-1.jpg',
      uploadOrder: 1,
      uploadedAt: Timestamp.now(),
    });
    await addDoc(collection(db, 'photos'), {
      campaignId: campaign1Ref.id,
      imageUrl: '/uploads/campaigns/oak-ridge-dallas/photo-2.jpg',
      uploadOrder: 2,
      uploadedAt: Timestamp.now(),
    });
    await addDoc(collection(db, 'photos'), {
      campaignId: campaign1Ref.id,
      imageUrl: '/uploads/campaigns/oak-ridge-dallas/photo-3.jpg',
      uploadOrder: 3,
      uploadedAt: Timestamp.now(),
    });
    console.log('  ✓ Added 3 photos for Oak Ridge campaign');

    // Photos for Campaign 2 (Meadowbrook)
    await addDoc(collection(db, 'photos'), {
      campaignId: campaign2Ref.id,
      imageUrl: '/uploads/campaigns/meadowbrook-fort-worth/photo-1.jpg',
      uploadOrder: 1,
      uploadedAt: Timestamp.now(),
    });
    await addDoc(collection(db, 'photos'), {
      campaignId: campaign2Ref.id,
      imageUrl: '/uploads/campaigns/meadowbrook-fort-worth/photo-2.jpg',
      uploadOrder: 2,
      uploadedAt: Timestamp.now(),
    });
    console.log('  ✓ Added 2 photos for Meadowbrook campaign');

    // Photos for Campaign 3 (Lakeside)
    await addDoc(collection(db, 'photos'), {
      campaignId: campaign3Ref.id,
      imageUrl: '/uploads/campaigns/lakeside-plano/photo-1.jpg',
      uploadOrder: 1,
      uploadedAt: Timestamp.now(),
    });
    await addDoc(collection(db, 'photos'), {
      campaignId: campaign3Ref.id,
      imageUrl: '/uploads/campaigns/lakeside-plano/photo-2.jpg',
      uploadOrder: 2,
      uploadedAt: Timestamp.now(),
    });
    await addDoc(collection(db, 'photos'), {
      campaignId: campaign3Ref.id,
      imageUrl: '/uploads/campaigns/lakeside-plano/photo-3.jpg',
      uploadOrder: 3,
      uploadedAt: Timestamp.now(),
    });
    console.log('  ✓ Added 3 photos for Lakeside campaign\n');

    // ===== 4. SEED SAMPLE LEADS =====
    console.log('📝 Seeding sample leads...');

    await addDoc(collection(db, 'leads'), {
      campaignId: campaign1Ref.id,
      name: 'Michael Brown',
      address: '123 Oak Street, Dallas TX 75001',
      email: 'michael@example.com',
      phone: '(214) 555-7890',
      notes: 'I noticed some shingles missing after the last storm.',
      submittedAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
      status: 'new',
    });

    await addDoc(collection(db, 'leads'), {
      campaignId: campaign1Ref.id,
      name: 'Jennifer Davis',
      address: '456 Ridge Road, Dallas TX 75001',
      email: 'jennifer@example.com',
      phone: '(214) 555-8901',
      notes: null,
      submittedAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), // 1 day ago
      status: 'contacted',
    });

    await addDoc(collection(db, 'leads'), {
      campaignId: campaign2Ref.id,
      name: 'Robert Wilson',
      address: '789 Meadow Lane, Fort Worth TX 76102',
      email: 'robert@example.com',
      phone: '(817) 555-9012',
      notes: 'Water damage in the attic. Need inspection ASAP.',
      submittedAt: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000)), // 12 hours ago
      status: 'new',
    });

    await addDoc(collection(db, 'leads'), {
      campaignId: campaign3Ref.id,
      name: 'Linda Martinez',
      address: '321 Lake View Drive, Plano TX 75023',
      email: 'linda@example.com',
      phone: '(972) 555-0123',
      notes: 'Interested in full roof replacement. Please call after 5pm.',
      submittedAt: Timestamp.fromDate(new Date(Date.now() - 3 * 60 * 60 * 1000)), // 3 hours ago
      status: 'new',
    });

    await addDoc(collection(db, 'leads'), {
      campaignId: campaign3Ref.id,
      name: 'David Lee',
      address: '654 Lakeside Court, Plano TX 75023',
      email: 'david@example.com',
      phone: '(972) 555-4567',
      notes: null,
      submittedAt: Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)), // 30 minutes ago
      status: 'new',
    });

    console.log('  ✓ Added 5 sample leads\n');

    // ===== SUMMARY =====
    console.log('✅ Firestore seeding complete!\n');
    console.log('Summary:');
    console.log('  • 2 contractors');
    console.log('  • 3 campaigns');
    console.log('  • 8 photos');
    console.log('  • 5 leads\n');

    console.log('Test URLs:');
    console.log(`  • http://localhost:3000/c/oak-ridge-subdivision-dallas-tx`);
    console.log(`  • http://localhost:3000/c/meadowbrook-heights-fort-worth-tx`);
    console.log(`  • http://localhost:3000/c/lakeside-village-plano-tx\n`);

    console.log('🔥 Ready to test with Firestore!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Firestore:', error);
    process.exit(1);
  }
}

// Run the seed function
seedFirestore();
