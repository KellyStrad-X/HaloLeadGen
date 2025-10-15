import { notFound } from 'next/navigation';
import SuccessPageClient from '@/components/SuccessPageClient';
import { getCampaignByIdSerializedAdmin } from '@/lib/firestore-admin';

interface SuccessPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CampaignSuccessPage({ params }: SuccessPageProps) {
  const { id } = await params;
  const campaign = await getCampaignByIdSerializedAdmin(id);

  if (!campaign) {
    notFound();
  }

  // Construct landing page URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const landingPageUrl = `${baseUrl}/c/${campaign.pageSlug}`;

  return <SuccessPageClient campaign={campaign} landingPageUrl={landingPageUrl} />;
}

export async function generateMetadata({ params }: SuccessPageProps) {
  const { id } = await params;
  const campaign = await getCampaignByIdSerializedAdmin(id);

  if (!campaign) {
    return {
      title: 'Campaign Not Found',
    };
  }

  const campaignTitle =
    campaign.campaignName || campaign.neighborhoodName || 'Campaign';

  return {
    title: `Campaign Created - ${campaignTitle} | Halo`,
    description: `Your campaign for ${campaignTitle} is live!`,
  };
}
