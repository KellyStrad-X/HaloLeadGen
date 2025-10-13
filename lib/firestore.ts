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
  DocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';

/**
 * Type definitions for Firestore documents
 */

// Internal Firestore types (with Timestamp objects)
interface ContractorDoc {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  createdAt: Timestamp;
}

interface CampaignDoc {
  id: string;
  contractorId: string;
  neighborhoodName: string;
  pageSlug: string;
  qrCodeUrl: string | null;
  createdAt: Timestamp;
  status: 'active' | 'paused' | 'completed';
}

interface LeadDoc {
  id: string;
  campaignId: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  notes: string | null;
  submittedAt: Timestamp;
  status: 'new' | 'contacted' | 'qualified' | 'closed' | 'lost';
}

interface PhotoDoc {
  id: string;
  campaignId: string;
  imageUrl: string;
  uploadOrder: number;
  uploadedAt: Timestamp;
}

// Exported serializable types (Timestamps converted to strings for Next.js)
export interface Contractor {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  createdAt: string; // ISO date string
}

export interface Campaign {
  id: string;
  contractorId: string;
  neighborhoodName: string;
  pageSlug: string;
  qrCodeUrl: string | null;
  createdAt: string; // ISO date string
  status: 'active' | 'paused' | 'completed';
}

export interface Lead {
  id: string;
  campaignId: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  notes: string | null;
  submittedAt: string; // ISO date string
  status: 'new' | 'contacted' | 'qualified' | 'closed' | 'lost';
}

export interface Photo {
  id: string;
  campaignId: string;
  imageUrl: string;
  uploadOrder: number;
  uploadedAt: string; // ISO date string
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
 * Works with both QueryDocumentSnapshot and DocumentSnapshot
 */
function docToData<T>(
  docSnap: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>
): (T & { id: string }) | null {
  if (!docSnap.exists()) {
    return null;
  }
  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as T & { id: string };
}

/**
 * Helper: Convert Firestore Timestamp to ISO string for serialization
 */
function serializeTimestamp(timestamp: Timestamp): string {
  return timestamp.toDate().toISOString();
}

/**
 * Helper: Serialize contractor doc for client
 */
function serializeContractor(doc: ContractorDoc): Contractor {
  return {
    ...doc,
    createdAt: serializeTimestamp(doc.createdAt),
  };
}

/**
 * Helper: Serialize campaign doc for client
 */
function serializeCampaign(doc: CampaignDoc): Campaign {
  return {
    ...doc,
    createdAt: serializeTimestamp(doc.createdAt),
  };
}

/**
 * Helper: Serialize photo doc for client
 */
function serializePhoto(doc: PhotoDoc): Photo {
  return {
    ...doc,
    uploadedAt: serializeTimestamp(doc.uploadedAt),
  };
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
    const campaignData = docToData<CampaignDoc>(campaignDoc);

    if (!campaignData) {
      return null;
    }

    // Fetch contractor (separate query since Firestore doesn't have JOINs)
    const contractorRef = doc(db, 'contractors', campaignData.contractorId);
    const contractorSnap = await getDoc(contractorRef);

    if (!contractorSnap.exists()) {
      console.error('Contractor not found for campaign:', campaignData.id);
      return null;
    }

    const contractorData = docToData<ContractorDoc>(contractorSnap);

    if (!contractorData) {
      return null;
    }

    // Fetch photos for this campaign
    const photosRef = collection(db, 'photos');
    const photosQuery = query(
      photosRef,
      where('campaignId', '==', campaignData.id),
      orderBy('uploadOrder', 'asc')
    );

    const photosSnapshot = await getDocs(photosQuery);
    const photosData = photosSnapshot.docs
      .map(doc => docToData<PhotoDoc>(doc))
      .filter((p): p is PhotoDoc => p !== null);

    // Serialize all data for client components
    return {
      ...serializeCampaign(campaignData),
      contractor: serializeContractor(contractorData),
      photos: photosData.map(serializePhoto),
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

    const campaignData = docToData<CampaignDoc>(campaignSnap);

    if (!campaignData) {
      return null;
    }

    // Serialize for client
    return serializeCampaign(campaignData);
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
      orderBy('submittedAt', 'desc'), // Required for range filter
      limit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking for duplicate lead:', error);
    // Note: First run may prompt to create composite index in Firebase Console
    // Index needed: campaigns + email + submittedAt
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
