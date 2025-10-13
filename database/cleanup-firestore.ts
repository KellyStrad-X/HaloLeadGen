/**
 * Cleanup script to delete all test data from Firestore
 * Run with: npx tsx database/cleanup-firestore.ts
 */

import { db } from '../lib/firebase';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';

async function cleanupCollection(collectionName: string) {
  console.log(`\n🗑️  Cleaning up ${collectionName}...`);

  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);

    if (snapshot.empty) {
      console.log(`   ✅ ${collectionName} is already empty`);
      return 0;
    }

    let deleteCount = 0;
    const deletePromises = snapshot.docs.map(async (docSnapshot) => {
      await deleteDoc(doc(db, collectionName, docSnapshot.id));
      deleteCount++;
    });

    await Promise.all(deletePromises);
    console.log(`   ✅ Deleted ${deleteCount} documents from ${collectionName}`);
    return deleteCount;
  } catch (error) {
    console.error(`   ❌ Error cleaning ${collectionName}:`, error);
    throw error;
  }
}

async function cleanupFirestore() {
  console.log('🧹 Starting Firestore cleanup...\n');
  console.log('This will delete ALL data from the following collections:');
  console.log('  - contractors');
  console.log('  - campaigns');
  console.log('  - leads');
  console.log('  - photos');
  console.log('');

  try {
    // Clean up all collections
    const contractors = await cleanupCollection('contractors');
    const campaigns = await cleanupCollection('campaigns');
    const leads = await cleanupCollection('leads');
    const photos = await cleanupCollection('photos');

    const total = contractors + campaigns + leads + photos;

    console.log('\n✨ Cleanup complete!');
    console.log(`   Total documents deleted: ${total}`);
    console.log('');
    console.log('💡 You can now run the seed script to add fresh test data:');
    console.log('   npm run seed:firestore');
    console.log('');
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanupFirestore();
