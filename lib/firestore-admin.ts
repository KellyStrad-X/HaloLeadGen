import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from './firebase-admin';
import { generateSlug } from './firestore';

type JobStatus = 'Completed' | 'Pending';
type CampaignStatus = 'Active' | 'Inactive';

export interface AdminCampaign {
  id: string;
  contractorId: string;
  campaignName: string;
  showcaseAddress?: string | null;
  homeownerName?: string | null;
  jobStatus?: JobStatus | null;
  campaignStatus?: CampaignStatus;
  neighborhoodName?: string | null;
  pageSlug: string;
  qrCodeUrl?: string | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: unknown;
}

async function generateUniqueSlugAdmin(text: string): Promise<string> {
  const adminDb = getAdminFirestore();
  const baseSlug = generateSlug(text) || 'campaign';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const snapshot = await adminDb
      .collection('campaigns')
      .where('pageSlug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function createCampaignAdmin({
  contractorId,
  campaignName,
  showcaseAddress,
  homeownerName,
  jobStatus,
}: {
  contractorId: string;
  campaignName: string;
  showcaseAddress: string;
  homeownerName?: string | null;
  jobStatus: JobStatus;
}): Promise<{ id: string; slug: string }> {
  const adminDb = getAdminFirestore();
  const slug = await generateUniqueSlugAdmin(campaignName);
  const now = Timestamp.now();
  const trimmedName = campaignName.trim();
  const trimmedAddress = showcaseAddress.trim();

  const docRef = await adminDb.collection('campaigns').add({
    contractorId,
    campaignName: trimmedName,
    homeownerName: homeownerName?.trim() || null,
    showcaseAddress: trimmedAddress,
    jobStatus,
    campaignStatus: 'Active' as CampaignStatus,
    neighborhoodName: trimmedAddress || trimmedName,
    pageSlug: slug,
    qrCodeUrl: null,
    createdAt: now,
    updatedAt: now,
  });

  return { id: docRef.id, slug };
}

export async function getCampaignByIdAdmin(
  campaignId: string
): Promise<AdminCampaign | null> {
  const adminDb = getAdminFirestore();
  const docSnap = await adminDb.collection('campaigns').doc(campaignId).get();

  if (!docSnap.exists) {
    return null;
  }

  return {
    id: docSnap.id,
    ...(docSnap.data() as Record<string, unknown>),
  } as AdminCampaign;
}

export async function addPhotoAdmin({
  campaignId,
  imageUrl,
  uploadOrder,
}: {
  campaignId: string;
  imageUrl: string;
  uploadOrder: number;
}): Promise<string> {
  const adminDb = getAdminFirestore();
  const docRef = await adminDb.collection('photos').add({
    campaignId,
    imageUrl,
    uploadOrder,
    uploadedAt: Timestamp.now(),
  });

  return docRef.id;
}

export async function updateCampaignQRCodeAdmin(
  campaignId: string,
  qrCodeUrl: string
): Promise<void> {
  const adminDb = getAdminFirestore();
  await adminDb.collection('campaigns').doc(campaignId).update({
    qrCodeUrl,
    updatedAt: Timestamp.now(),
  });
}

export async function isDuplicateLeadAdmin(
  campaignId: string,
  email: string,
  withinMinutes = 60
): Promise<boolean> {
  const adminDb = getAdminFirestore();
  const cutoffTime = Timestamp.fromDate(
    new Date(Date.now() - withinMinutes * 60 * 1000)
  );

  const snapshot = await adminDb
    .collection('leads')
    .where('campaignId', '==', campaignId)
    .where('email', '==', email.toLowerCase())
    .where('submittedAt', '>', cutoffTime)
    .orderBy('submittedAt', 'desc')
    .limit(1)
    .get();

  return !snapshot.empty;
}

export async function submitLeadAdmin({
  campaignId,
  name,
  address,
  email,
  phone,
  notes,
}: {
  campaignId: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  notes?: string;
}): Promise<string> {
  const adminDb = getAdminFirestore();

  const docRef = await adminDb.collection('leads').add({
    campaignId,
    name: name.trim(),
    address: address.trim(),
    email: email.trim().toLowerCase(),
    phone,
    notes: notes?.trim() || null,
    submittedAt: Timestamp.now(),
    status: 'new',
  });

  return docRef.id;
}
