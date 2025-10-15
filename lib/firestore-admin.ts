import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from './firebase-admin';
import {
  generateSlug,
  type Campaign,
  type CampaignData,
  type Contractor,
  type Photo,
} from './firestore';
import type { AggregateQuerySnapshot } from 'firebase-admin/firestore';

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

export interface AdminLeadSummary {
  id: string;
  campaignId: string;
  campaignName: string;
  name: string;
  email: string;
  phone: string;
  submittedAt: string;
}

export interface DashboardSummary {
  stats: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalLeads: number;
    recentLeads: number;
  };
  recentLeads: AdminLeadSummary[];
}

export interface DashboardCampaign {
  id: string;
  campaignName: string;
  showcaseAddress: string | null;
  jobStatus: JobStatus | null;
  campaignStatus: CampaignStatus;
  createdAt: string;
  leadCount: number;
  pageSlug: string;
}

export interface DashboardCampaignDetails {
  campaign: Campaign;
  photos: Photo[];
  leads: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string | null;
    notes: string | null;
    submittedAt: string;
  }[];
}

function serializeTimestamp(timestamp?: Timestamp | null): string {
  if (!timestamp) {
    return new Date().toISOString();
  }

  return timestamp.toDate().toISOString();
}

function normalizeCampaignStatusAdmin(
  data: Partial<AdminCampaign>
): CampaignStatus {
  const raw = (data.campaignStatus ?? data.status) as string | undefined;

  if (!raw) {
    return 'Active';
  }

  return raw.toLowerCase() === 'active' ? 'Active' : 'Inactive';
}

function toCampaignAdmin(doc: FirebaseFirestore.DocumentSnapshot): Campaign {
  const data = (doc.data() || {}) as Partial<AdminCampaign>;
  const campaignStatus = normalizeCampaignStatusAdmin(data);

  const campaignName =
    (data.campaignName && data.campaignName.trim()) ||
    (data.neighborhoodName && data.neighborhoodName.trim()) ||
    'Halo Campaign';

  const showcaseAddress =
    (data.showcaseAddress && data.showcaseAddress.trim()) ||
    (data.neighborhoodName && data.neighborhoodName.trim()) ||
    null;

  const createdAt = serializeTimestamp(data.createdAt as Timestamp | undefined);
  const updatedAtTimestamp = data.updatedAt as Timestamp | undefined;

  return {
    id: doc.id,
    contractorId: data.contractorId || '',
    campaignName,
    neighborhoodName:
      (data.neighborhoodName && data.neighborhoodName.trim()) ||
      showcaseAddress ||
      campaignName,
    showcaseAddress,
    homeownerName: data.homeownerName?.toString() || null,
    jobStatus: (data.jobStatus as JobStatus | undefined) ?? null,
    campaignStatus,
    status: data.status as Campaign['status'],
    pageSlug: data.pageSlug || generateSlug(campaignName),
    qrCodeUrl: (data.qrCodeUrl as string | null | undefined) ?? null,
    createdAt,
    updatedAt: updatedAtTimestamp ? serializeTimestamp(updatedAtTimestamp) : null,
  };
}

function toContractorAdmin(
  doc: FirebaseFirestore.DocumentSnapshot
): Contractor | null {
  if (!doc.exists) {
    return null;
  }

  const data = doc.data() || {};

  return {
    id: doc.id,
    name: (data.name as string) || '',
    company: (data.company as string) || '',
    email: (data.email as string) || '',
    phone: (data.phone as string) || '',
    license: (data.license as string | null | undefined) ?? null,
    createdAt: serializeTimestamp(data.createdAt as Timestamp | undefined),
  };
}

function toPhotoAdmin(doc: FirebaseFirestore.DocumentSnapshot): Photo {
  const data = doc.data() || {};

  return {
    id: doc.id,
    campaignId: (data.campaignId as string) || '',
    imageUrl: (data.imageUrl as string) || '',
    uploadOrder: Number(data.uploadOrder ?? 0),
    uploadedAt: serializeTimestamp(data.uploadedAt as Timestamp | undefined),
  };
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

export async function getCampaignByIdSerializedAdmin(
  campaignId: string
): Promise<Campaign | null> {
  const adminDb = getAdminFirestore();
  const docSnap = await adminDb.collection('campaigns').doc(campaignId).get();

  if (!docSnap.exists) {
    return null;
  }

  return toCampaignAdmin(docSnap);
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

export async function getCampaignDataBySlugAdmin(
  slug: string
): Promise<CampaignData | null> {
  const adminDb = getAdminFirestore();
  const snapshot = await adminDb
    .collection('campaigns')
    .where('pageSlug', '==', slug)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const campaignDoc = snapshot.docs[0];
  const campaign = toCampaignAdmin(campaignDoc);

  if (campaign.campaignStatus !== 'Active') {
    return null;
  }

  const contractorSnap = await adminDb
    .collection('contractors')
    .doc(campaign.contractorId)
    .get();
  const contractor = toContractorAdmin(contractorSnap);

  const photosSnap = await adminDb
    .collection('photos')
    .where('campaignId', '==', campaign.id)
    .orderBy('uploadOrder', 'asc')
    .get();
  const photos = photosSnap.docs.map(toPhotoAdmin);

  if (!contractor) {
    return null;
  }

  return {
    ...campaign,
    contractor,
    photos,
  };
}

export async function getDashboardSummaryAdmin(
  contractorId: string
): Promise<DashboardSummary> {
  const adminDb = getAdminFirestore();
  const campaignsSnapshot = await adminDb
    .collection('campaigns')
    .where('contractorId', '==', contractorId)
    .get();

  const campaigns = campaignsSnapshot.docs.map(toCampaignAdmin);
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(
    campaign => campaign.campaignStatus === 'Active'
  ).length;

  let totalLeads = 0;
  const collectedLeads: AdminLeadSummary[] = [];

  for (const campaignDoc of campaignsSnapshot.docs) {
    const campaignData = toCampaignAdmin(campaignDoc);

    const countSnapshot: AggregateQuerySnapshot = await adminDb
      .collection('leads')
      .where('campaignId', '==', campaignDoc.id)
      .count()
      .get();

    totalLeads += countSnapshot.data().count;

    const leadsSnapshot = await adminDb
      .collection('leads')
      .where('campaignId', '==', campaignDoc.id)
      .orderBy('submittedAt', 'desc')
      .limit(25)
      .get();

    for (const leadDoc of leadsSnapshot.docs) {
      const leadData = leadDoc.data() || {};
      collectedLeads.push({
        id: leadDoc.id,
        campaignId: campaignDoc.id,
        campaignName: campaignData.campaignName,
        name: (leadData.name as string) || '',
        email: (leadData.email as string) || '',
        phone: (leadData.phone as string) || '',
        submittedAt: serializeTimestamp(leadData.submittedAt as Timestamp | undefined),
      });
    }
  }

  collectedLeads.sort((a, b) => {
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
  });

  const recentLeads = collectedLeads.slice(0, 5);

  return {
    stats: {
      totalCampaigns,
      activeCampaigns,
      totalLeads,
      recentLeads: recentLeads.length,
    },
    recentLeads,
  };
}

export async function getDashboardCampaignsAdmin(
  contractorId: string
): Promise<DashboardCampaign[]> {
  const adminDb = getAdminFirestore();

  const campaignsSnapshot = await adminDb
    .collection('campaigns')
    .where('contractorId', '==', contractorId)
    .orderBy('createdAt', 'desc')
    .get();

  const campaigns: DashboardCampaign[] = [];

  for (const campaignDoc of campaignsSnapshot.docs) {
    const campaign = toCampaignAdmin(campaignDoc);

    const countSnapshot: AggregateQuerySnapshot = await adminDb
      .collection('leads')
      .where('campaignId', '==', campaignDoc.id)
      .count()
      .get();

    campaigns.push({
      id: campaign.id,
      campaignName: campaign.campaignName,
      showcaseAddress: campaign.showcaseAddress,
      jobStatus: campaign.jobStatus,
      campaignStatus: campaign.campaignStatus,
      createdAt: campaign.createdAt,
      leadCount: countSnapshot.data().count,
      pageSlug: campaign.pageSlug,
    });
  }

  return campaigns;
}

export async function getDashboardCampaignDetailsAdmin(
  contractorId: string,
  campaignId: string
): Promise<DashboardCampaignDetails | null> {
  const adminDb = getAdminFirestore();
  const campaignDoc = await adminDb.collection('campaigns').doc(campaignId).get();

  if (!campaignDoc.exists) {
    return null;
  }

  const campaign = toCampaignAdmin(campaignDoc);

  if (campaign.contractorId !== contractorId) {
    return null;
  }

  const photosSnap = await adminDb
    .collection('photos')
    .where('campaignId', '==', campaignId)
    .orderBy('uploadOrder', 'asc')
    .get();
  const photos = photosSnap.docs.map(toPhotoAdmin);

  const leadsSnap = await adminDb
    .collection('leads')
    .where('campaignId', '==', campaignId)
    .orderBy('submittedAt', 'desc')
    .get();

  const leads = leadsSnap.docs.map(leadDoc => {
    const data = leadDoc.data() || {};
    return {
      id: leadDoc.id,
      name: (data.name as string) || '',
      email: (data.email as string) || '',
      phone: (data.phone as string) || '',
      address: (data.address as string | null | undefined) ?? null,
      notes: (data.notes as string | null | undefined) ?? null,
      submittedAt: serializeTimestamp(data.submittedAt as Timestamp | undefined),
    };
  });

  return {
    campaign,
    photos,
    leads,
  };
}
