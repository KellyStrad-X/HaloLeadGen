/**
 * Debug script to check Firestore connection and see what data exists
 * Run with: npx tsx database/debug-firestore.ts
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function debugFirestore() {
  console.log('🔍 Firestore Debug Info\n');

  // Show environment variables
  console.log('📋 Environment Variables:');
  console.log(`   Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '❌ NOT SET'}`);
  console.log(`   Storage Bucket: ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '❌ NOT SET'}`);
  console.log(`   API Key: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ NOT SET'}`);
  console.log('');

  // Try to read each collection
  const collections = ['contractors', 'campaigns', 'leads', 'photos'];

  for (const collectionName of collections) {
    try {
      console.log(`📂 Checking collection: ${collectionName}`);
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);

      console.log(`   Documents found: ${snapshot.size}`);

      if (snapshot.size > 0) {
        console.log(`   Sample data from first document:`);
        const firstDoc = snapshot.docs[0];
        console.log(`   - ID: ${firstDoc.id}`);
        console.log(`   - Data:`, JSON.stringify(firstDoc.data(), null, 2).substring(0, 200) + '...');
      }
      console.log('');
    } catch (error: any) {
      console.error(`   ❌ Error reading ${collectionName}:`, error.message);
      console.log('');
    }
  }

  console.log('✨ Debug complete!');
}

debugFirestore().catch(console.error);
