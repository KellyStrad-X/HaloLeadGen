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
  updateDoc,
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
  license?: string | null;
  createdAt: Timestamp;
}

export interface StormInfo {
  enabled: boolean;
  stormDate: string;
  windSpeed: string;
  hailSize: string;
  affectedAreas: string;
  additionalNotes?: string;
}

interface CampaignDoc {
  id: string;
  contractorId: string;
  campaignName?: string;
  homeownerName?: string | null;
  showcaseAddress?: string | null;
  qrDisplayName?: string | null;
  jobStatus?: 'Completed' | 'Pending';
  campaignStatus?: 'Active' | 'Inactive';
  neighborhoodName?: string;
  pageSlug: string;
  qrCodeUrl: string | null;
  stormInfo?: StormInfo | null;
  serviceRadiusMiles?: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  status?: 'active' | 'paused' | 'completed';
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
  license?: string | null;
  createdAt: string; // ISO date string
}

export interface Campaign {
  id: string;
  contractorId: string;
  campaignName: string;
  neighborhoodName: string;
  showcaseAddress: string | null;
  qrDisplayName?: string | null;
  homeownerName: string | null;
  jobStatus: 'Completed' | 'Pending' | null;
  campaignStatus: 'Active' | 'Inactive';
  status?: 'active' | 'paused' | 'completed';
  pageSlug: string;
  qrCodeUrl: string | null;
  stormInfo?: StormInfo | null;
  serviceRadiusMiles?: number;
  createdAt: string; // ISO date string
  updatedAt: string | null;
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
function normalizeCampaignStatus(doc: CampaignDoc): 'Active' | 'Inactive' {
  const rawStatus = doc.campaignStatus ?? doc.status;

  if (!rawStatus) {
    return 'Active';
  }

  const normalized = rawStatus.toString().toLowerCase();
  if (normalized === 'active') {
    return 'Active';
  }

  return 'Inactive';
}

function serializeCampaign(doc: CampaignDoc): Campaign {
  const campaignName =
    doc.campaignName?.trim() ||
    doc.neighborhoodName?.trim() ||
    'Halo Campaign';

  const showcaseAddress =
    doc.showcaseAddress?.trim() ||
    doc.neighborhoodName?.trim() ||
    null;

  const neighborhoodName =
    doc.neighborhoodName?.trim() ||
    showcaseAddress ||
    campaignName;

  const homeownerName = doc.homeownerName?.trim() || null;
  const qrDisplayName = doc.qrDisplayName?.trim() || null;
  const jobStatus = doc.jobStatus ?? null;
  const campaignStatus = normalizeCampaignStatus(doc);

  return {
    id: doc.id,
    contractorId: doc.contractorId,
    campaignName,
    neighborhoodName,
    showcaseAddress,
    qrDisplayName,
    homeownerName,
    jobStatus,
    campaignStatus,
    status: doc.status,
    pageSlug: doc.pageSlug,
    qrCodeUrl: doc.qrCodeUrl,
    stormInfo: doc.stormInfo || null,
    createdAt: serializeTimestamp(doc.createdAt),
    updatedAt: doc.updatedAt ? serializeTimestamp(doc.updatedAt) : null,
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

    const isActive = normalizeCampaignStatus(campaignData) === 'Active';
    if (!isActive) {
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

/**
 * Find or create contractor by email
 * Returns contractor ID
 */
export async function findOrCreateContractor(contractorData: {
  name: string;
  company: string;
  email: string;
  phone: string;
}): Promise<string> {
  try {
    // Check if contractor exists by email
    const contractorsRef = collection(db, 'contractors');
    const q = query(
      contractorsRef,
      where('email', '==', contractorData.email.toLowerCase()),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Contractor exists, return existing ID
      return snapshot.docs[0].id;
    }

    // Create new contractor
    const newContractor = {
      name: contractorData.name.trim(),
      company: contractorData.company.trim(),
      email: contractorData.email.trim().toLowerCase(),
      phone: contractorData.phone,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(contractorsRef, newContractor);

    console.log('New contractor created:', {
      contractorId: docRef.id,
      email: contractorData.email,
    });

    return docRef.id;
  } catch (error) {
    console.error('Error finding/creating contractor:', error);
    throw new Error('Failed to create contractor');
  }
}

/**
 * Create a new campaign
 * Returns campaign ID
 */
export async function createCampaign(campaignData: {
  contractorId: string;
  campaignName: string;
  showcaseAddress?: string | null;
  homeownerName?: string | null;
  jobStatus?: 'Completed' | 'Pending';
}): Promise<string> {
  try {
    // Generate unique slug from neighborhood name
    const slug = await generateUniqueSlug(campaignData.campaignName);
    const now = Timestamp.now();
    const showcaseAddress = campaignData.showcaseAddress?.trim() || null;
    const campaignName = campaignData.campaignName.trim();

    const campaignsRef = collection(db, 'campaigns');

    const newCampaign = {
      contractorId: campaignData.contractorId,
      campaignName,
      homeownerName: campaignData.homeownerName?.trim() || null,
      showcaseAddress,
      jobStatus: campaignData.jobStatus ?? 'Completed',
      campaignStatus: 'Active' as const,
      neighborhoodName: showcaseAddress || campaignName,
      pageSlug: slug,
      qrCodeUrl: null, // Will be set after QR generation
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(campaignsRef, newCampaign);

    console.log('New campaign created:', {
      campaignId: docRef.id,
      slug,
      campaign: campaignName,
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw new Error('Failed to create campaign');
  }
}

/**
 * Add photo to campaign
 * Returns photo ID
 */
export async function addPhoto(photoData: {
  campaignId: string;
  imageUrl: string;
  uploadOrder: number;
}): Promise<string> {
  try {
    const photosRef = collection(db, 'photos');

    const newPhoto = {
      campaignId: photoData.campaignId,
      imageUrl: photoData.imageUrl,
      uploadOrder: photoData.uploadOrder,
      uploadedAt: Timestamp.now(),
    };

    const docRef = await addDoc(photosRef, newPhoto);

    console.log('Photo added:', {
      photoId: docRef.id,
      campaignId: photoData.campaignId,
      order: photoData.uploadOrder,
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding photo:', error);
    throw new Error('Failed to add photo');
  }
}

/**
 * Update campaign QR code URL
 */
export async function updateCampaignQRCode(
  campaignId: string,
  qrCodeUrl: string
): Promise<void> {
  try {
    const campaignRef = doc(db, 'campaigns', campaignId);
    await updateDoc(campaignRef, {
      qrCodeUrl,
      updatedAt: Timestamp.now(),
    });

    console.log('Campaign QR code updated:', {
      campaignId,
      qrCodeUrl,
    });
  } catch (error) {
    console.error('Error updating campaign QR code:', error);
    throw new Error('Failed to update QR code');
  }
}
