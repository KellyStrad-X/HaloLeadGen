/**
 * Firestore database utilities
 * Replaces SQLite with Firebase Firestore
 */

import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';

/**
 * Type definitions for Firestore documents
 */

export interface Contractor {
  id: string; // Firestore auto-generated ID
  name: string;
  company: string;
  email: string;
  phone: string;
  createdAt: Timestamp;
}

export interface Campaign {
  id: string; // Firestore auto-generated ID
  contractorId: string; // Reference to contractor document
  neighborhoodName: string;
  pageSlug: string;
  qrCodeUrl: string | null; // Firebase Storage URL (not path)
  createdAt: Timestamp;
  status: 'active' | 'paused' | 'completed';
}

export interface Lead {
  id: string; // Firestore auto-generated ID
  campaignId: string; // Reference to campaign document
  name: string;
  address: string;
  email: string;
  phone: string;
  notes: string | null;
  submittedAt: Timestamp;
  status: 'new' | 'contacted' | 'qualified' | 'closed' | 'lost';
}

export interface Photo {
  id: string; // Firestore auto-generated ID
  campaignId: string; // Reference to campaign document
  imageUrl: string; // Firebase Storage URL (not path)
  uploadOrder: number;
  uploadedAt: Timestamp;
}

/**
 * Campaign Data with populated contractor and photos
 * Used by landing pages
 */
export interface CampaignData extends Campaign {
  contractor: Contractor;
  photos: Photo[];
}

/**
 * Helper: Convert Firestore document to typed object
 */
function docToData<T>(docSnap: QueryDocumentSnapshot<DocumentData>): T & { id: string } {
  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as T & { id: string };
}

/**
 * Get campaign by slug with contractor info and photos
 * Replaces the JOIN query from SQLite
 */
export async function getCampaignBySlug(slug: string): Promise<CampaignData | null> {
  try {
    // Query campaigns collection for matching slug and active status
    const campaignsRef = collection(db, 'campaigns');
    const q = query(
      campaignsRef,
      where('pageSlug', '==', slug),
      where('status', '==', 'active'),
      limit(1)
    );

    const campaignSnapshot = await getDocs(q);

    if (campaignSnapshot.empty) {
      return null;
    }

    const campaignDoc = campaignSnapshot.docs[0];
    const campaign = docToData<Campaign>(campaignDoc);

    // Fetch contractor (separate query since Firestore doesn't have JOINs)
    const contractorRef = doc(db, 'contractors', campaign.contractorId);
    const contractorSnap = await getDoc(contractorRef);

    if (!contractorSnap.exists()) {
      console.error('Contractor not found for campaign:', campaign.id);
      return null;
    }

    const contractor = docToData<Contractor>(contractorSnap);

    // Fetch photos for this campaign
    const photosRef = collection(db, 'photos');
    const photosQuery = query(
      photosRef,
      where('campaignId', '==', campaign.id),
      orderBy('uploadOrder', 'asc')
    );

    const photosSnapshot = await getDocs(photosQuery);
    const photos = photosSnapshot.docs.map(doc => docToData<Photo>(doc));

    return {
      ...campaign,
      contractor,
      photos,
    };
  } catch (error) {
    console.error('Error fetching campaign by slug:', error);
    return null;
  }
}

/**
 * Get campaign by ID
 */
export async function getCampaignById(campaignId: string): Promise<Campaign | null> {
  try {
    const campaignRef = doc(db, 'campaigns', campaignId);
    const campaignSnap = await getDoc(campaignRef);

    if (!campaignSnap.exists()) {
      return null;
    }

    return docToData<Campaign>(campaignSnap);
  } catch (error) {
    console.error('Error fetching campaign by ID:', error);
    return null;
  }
}

/**
 * Check for duplicate lead submission
 * Returns true if duplicate found (same email + campaign within 1 hour)
 */
export async function isDuplicateLead(
  campaignId: string,
  email: string,
  withinMinutes: number = 60
): Promise<boolean> {
  try {
    const cutoffTime = Timestamp.fromDate(
      new Date(Date.now() - withinMinutes * 60 * 1000)
    );

    const leadsRef = collection(db, 'leads');
    const q = query(
      leadsRef,
      where('campaignId', '==', campaignId),
      where('email', '==', email.toLowerCase()),
      where('submittedAt', '>', cutoffTime),
      limit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking for duplicate lead:', error);
    return false; // Fail open - allow submission if check fails
  }
}

/**
 * Submit a new lead
 * Returns the new lead ID
 */
export async function submitLead(leadData: {
  campaignId: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  notes?: string;
}): Promise<string> {
  try {
    const leadsRef = collection(db, 'leads');

    const newLead = {
      campaignId: leadData.campaignId,
      name: leadData.name.trim(),
      address: leadData.address.trim(),
      email: leadData.email.trim().toLowerCase(),
      phone: leadData.phone,
      notes: leadData.notes?.trim() || null,
      submittedAt: Timestamp.now(),
      status: 'new' as const,
    };

    const docRef = await addDoc(leadsRef, newLead);

    console.log('New lead submitted to Firestore:', {
      leadId: docRef.id,
      campaignId: leadData.campaignId,
      email: leadData.email,
    });

    return docRef.id;
  } catch (error) {
    console.error('Error submitting lead:', error);
    throw new Error('Failed to submit lead');
  }
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
export async function isSlugUnique(slug: string): Promise<boolean> {
  try {
    const campaignsRef = collection(db, 'campaigns');
    const q = query(campaignsRef, where('pageSlug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  } catch (error) {
    console.error('Error checking slug uniqueness:', error);
    return false;
  }
}

/**
 * Helper: Generate unique slug
 */
export async function generateUniqueSlug(text: string): Promise<string> {
  let slug = generateSlug(text);
  let counter = 1;

  while (!(await isSlugUnique(slug))) {
    slug = `${generateSlug(text)}-${counter}`;
    counter++;
  }

  return slug;
}
