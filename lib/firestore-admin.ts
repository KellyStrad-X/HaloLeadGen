import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from './firebase-admin';
import {
  generateSlug,
  type Campaign,
  type CampaignData,
  type Contractor,
  type Photo,
} from './firestore';
import { geocodeAddressServer, type Location } from './geocoding';

type JobStatus = 'Completed' | 'Pending';
type CampaignStatus = 'Active' | 'Inactive';

export interface StormInfo {
  enabled: boolean;
  stormDate: string;
  windSpeed: string;
  hailSize: string;
  affectedAreas: string;
  additionalNotes?: string;
}

export interface AdminCampaign {
  id: string;
  contractorId: string;
  campaignName: string;
  showcaseAddress?: string | null;
  qrDisplayName?: string | null;
  homeownerName?: string | null;
  jobStatus?: JobStatus | null;
  campaignStatus?: CampaignStatus;
  neighborhoodName?: string | null;
  pageSlug: string;
  qrCodeUrl?: string | null;
  stormInfo?: StormInfo | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  geocodedLocation?: {
    lat: number;
    lng: number;
    geocodedAt: Timestamp;
    address: string; // Address that was geocoded (for cache invalidation)
  } | null;
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

export interface RecentCampaignSummary {
  id: string;
  campaignName: string;
  showcaseAddress: string | null;
  jobStatus: JobStatus | null;
  campaignStatus: CampaignStatus;
  leadCount: number;
  pageSlug: string;
  createdAt: string;
  hasNewLeads: boolean; // Has leads in last 7 days
}

export interface DashboardSummary {
  stats: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalLeads: number;
    recentLeads: number;
  };
  recentLeads: AdminLeadSummary[];
  recentCampaigns: RecentCampaignSummary[];
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
  location?: Location | null;
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
    stormInfo: (data.stormInfo as StormInfo | undefined) || null,
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
  qrDisplayName,
  homeownerName,
  jobStatus,
  stormInfo,
}: {
  contractorId: string;
  campaignName: string;
  showcaseAddress: string;
  qrDisplayName: string;
  homeownerName?: string | null;
  jobStatus: JobStatus;
  stormInfo?: StormInfo | null;
}): Promise<{ id: string; slug: string }> {
  const adminDb = getAdminFirestore();
  const slug = await generateUniqueSlugAdmin(campaignName);
  const now = Timestamp.now();
  const trimmedName = campaignName.trim();
  const trimmedAddress = showcaseAddress.trim();
  const trimmedQrDisplayName = qrDisplayName.trim();

  const docRef = await adminDb.collection('campaigns').add({
    contractorId,
    campaignName: trimmedName,
    homeownerName: homeownerName?.trim() || null,
    showcaseAddress: trimmedAddress,
    qrDisplayName: trimmedQrDisplayName,
    jobStatus,
    campaignStatus: 'Active' as CampaignStatus,
    neighborhoodName: trimmedAddress || trimmedName,
    pageSlug: slug,
    qrCodeUrl: null,
    stormInfo: stormInfo || null,
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
  const campaignSummaries: RecentCampaignSummary[] = [];

  // Calculate time 7 days ago for "new leads" check
  const sevenDaysAgo = Timestamp.fromDate(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  for (const campaignDoc of campaignsSnapshot.docs) {
    const campaignData = toCampaignAdmin(campaignDoc);

    const countSnapshot = await adminDb
      .collection('leads')
      .where('campaignId', '==', campaignDoc.id)
      .count()
      .get();

    const leadCount = countSnapshot.data().count;
    totalLeads += leadCount;

    // Check for new leads in the last 7 days
    const recentLeadsSnapshot = await adminDb
      .collection('leads')
      .where('campaignId', '==', campaignDoc.id)
      .where('submittedAt', '>', sevenDaysAgo)
      .limit(1)
      .get();

    const hasNewLeads = !recentLeadsSnapshot.empty;

    // Add to campaign summaries
    campaignSummaries.push({
      id: campaignDoc.id,
      campaignName: campaignData.campaignName,
      showcaseAddress: campaignData.showcaseAddress,
      jobStatus: campaignData.jobStatus,
      campaignStatus: campaignData.campaignStatus,
      leadCount,
      pageSlug: campaignData.pageSlug,
      createdAt: campaignData.createdAt,
      hasNewLeads,
    });

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

  // Sort campaigns intelligently:
  // 1. Campaigns with new leads first
  // 2. Then by lead count (descending)
  // 3. Then by creation date (newest first)
  campaignSummaries.sort((a, b) => {
    if (a.hasNewLeads !== b.hasNewLeads) {
      return a.hasNewLeads ? -1 : 1;
    }
    if (a.leadCount !== b.leadCount) {
      return b.leadCount - a.leadCount;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const recentCampaigns = campaignSummaries.slice(0, 6); // Top 6 campaigns

  return {
    stats: {
      totalCampaigns,
      activeCampaigns,
      totalLeads,
      recentLeads: recentLeads.length,
    },
    recentLeads,
    recentCampaigns,
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
    const data = campaignDoc.data() as Partial<AdminCampaign>;

    const countSnapshot = await adminDb
      .collection('leads')
      .where('campaignId', '==', campaignDoc.id)
      .count()
      .get();

    // Check for cached geocoded location
    let location: Location | null = null;

    if (campaign.showcaseAddress) {
      const cached = data.geocodedLocation;

      // Use cache if address hasn't changed
      if (cached && cached.address === campaign.showcaseAddress) {
        location = {
          lat: cached.lat,
          lng: cached.lng,
        };
      } else {
        // Geocode and cache the result
        const geocodeResult = await geocodeAddressServer(campaign.showcaseAddress);
        if (geocodeResult) {
          location = geocodeResult.location;

          // Save to Firestore for future requests
          await campaignDoc.ref.update({
            geocodedLocation: {
              lat: location.lat,
              lng: location.lng,
              geocodedAt: Timestamp.now(),
              address: campaign.showcaseAddress,
            },
          });
        }
      }
    }

    campaigns.push({
      id: campaign.id,
      campaignName: campaign.campaignName,
      showcaseAddress: campaign.showcaseAddress,
      jobStatus: campaign.jobStatus,
      campaignStatus: campaign.campaignStatus,
      createdAt: campaign.createdAt,
      leadCount: countSnapshot.data().count,
      pageSlug: campaign.pageSlug,
      location,
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
      contractorStatus: (data.contractorStatus as
        | 'New'
        | 'Contacted'
        | 'Qualified'
        | 'Closed'
        | 'Lost'
        | undefined) ?? 'New',
    };
  });

  return {
    campaign,
    photos,
    leads,
  };
}

// Contractor Branding Types
export interface CrewMember {
  id: string;
  name: string;
  title: string;
  phone?: string;
  photoUrl: string;
  bio?: string; // Optional, 200 char max
  yearsExperience?: string;
  certifications?: string[];
}

export interface ContractorBranding {
  companyName?: string;
  companyLogo?: string;
  trustBadges?: string[];
  crewMembers?: CrewMember[];
}

/**
 * Fetch contractor branding settings for QR landing page
 */
export async function getContractorBrandingAdmin(
  contractorId: string
): Promise<ContractorBranding | null> {
  const adminDb = getAdminFirestore();
  const brandingDoc = await adminDb
    .collection('contractor_branding')
    .doc(contractorId)
    .get();

  if (!brandingDoc.exists) {
    return null;
  }

  const data = brandingDoc.data() || {};

  return {
    companyName: (data.companyName as string | undefined) || undefined,
    companyLogo: (data.companyLogo as string | undefined) || undefined,
    trustBadges: (data.trustBadges as string[] | undefined) || undefined,
    crewMembers: (data.crewMembers as CrewMember[] | undefined) || undefined,
  };
}
