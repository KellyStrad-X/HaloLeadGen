import { notFound } from 'next/navigation';
import type { CampaignData } from '@/lib/firestore';
import { getCampaignDataBySlugAdmin, getContractorBrandingAdmin } from '@/lib/firestore-admin';
import CampaignHero from '@/components/CampaignHero';
import PhotoDeck from '@/components/PhotoDeck';
import LeadForm from '@/components/LeadForm';
import TrustBadges from '@/components/TrustBadges';
import MeetTheCrew from '@/components/MeetTheCrew';
import StormBanner from '@/components/StormBanner';

interface CampaignPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { slug } = await params;
  const campaignData = await getCampaignDataBySlugAdmin(slug);

  if (!campaignData) {
    notFound();
  }

  // Fetch contractor branding (only trust badges + team)
  const branding = await getContractorBrandingAdmin(campaignData.contractorId);

  // Use qrDisplayName for privacy-safe display, fallback to location if not set
  const displayLocation =
    campaignData.qrDisplayName ||
    campaignData.showcaseAddress ||
    campaignData.neighborhoodName ||
    campaignData.campaignName;

  // Use company name override from branding if set, otherwise use contractor data
  const contractorName =
    branding?.companyName ||
    campaignData.contractor.company ||
    campaignData.contractor.name ||
    'Local Contractor';
  const contractorPhone = campaignData.contractor.phone?.trim();
  const contractorEmail = campaignData.contractor.email?.trim();

  // Default Halo branding (no customization)
  const primaryColor = '#06b6d4'; // Halo cyan
  const tagline = 'Professional roofing services from your local experts';

  return (
    <main className="min-h-screen bg-white">
      {/* Header - Dark, ultra-thin, sticky */}
      <header className="sticky top-0 z-50 bg-neutral-900 border-b border-neutral-700 shadow-lg">
        <div className="w-full pl-1 pr-2 sm:pl-2 lg:pl-6 lg:pr-8 py-0.5 md:py-1">
          <div className="flex items-center justify-between">
            {/* Contractor Name - Far left */}
            <div className="flex items-center">
              <h1 className="text-lg font-bold text-gray-100">
                {contractorName}
              </h1>
            </div>

            {/* Contact Buttons - Far right */}
            <div className="flex items-center gap-2">
              {contractorEmail && (
                <a
                  href={`mailto:${contractorEmail}`}
                  className="p-2 rounded-lg hover:bg-neutral-800 transition-colors text-cyan-400 hover:text-cyan-300"
                  aria-label="Email contractor"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              )}
              {contractorPhone && (
                <a
                  href={`tel:${contractorPhone}`}
                  className="p-2 rounded-lg hover:bg-neutral-800 transition-colors text-cyan-400 hover:text-cyan-300"
                  aria-label="Call contractor"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Background Carousel */}
      <CampaignHero>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold md:font-normal text-gray-900 mb-4 leading-tight drop-shadow-[0_2px_8px_rgba(255,255,255,0.9)]">
            <span style={{ color: primaryColor }}>{contractorName}</span> is in Your Area!
            <br />
            Schedule a FREE Inspection
          </h1>
          <p className="text-xl text-gray-800 font-bold md:font-normal mb-8 max-w-2xl mx-auto drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]">
            Professional roofing services from your local experts
          </p>

          {/* Trust Signals - Inline */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-900">
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
              <span className="text-green-600 text-lg">✓</span>
              <span className="font-semibold">Licensed & Insured</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
              <span className="text-green-600 text-lg">✓</span>
              <span className="font-semibold">Free Inspection</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
              <span className="text-green-600 text-lg">✓</span>
              <span className="font-semibold">Insurance Assistance</span>
            </div>
          </div>
        </div>
      </CampaignHero>

      {/* Trust Badges */}
      {branding?.trustBadges && branding.trustBadges.length > 0 && (
        <TrustBadges badges={branding.trustBadges} />
      )}

      {/* Storm Banner */}
      {campaignData.stormInfo && campaignData.stormInfo.enabled && (
        <StormBanner stormInfo={campaignData.stormInfo} />
      )}

      {/* Photo Gallery */}
      <section id="photo-gallery" className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 text-center">
            Storm Damage Documentation
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Recent photos from {displayLocation}
          </p>

          {/* Context Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-3xl mx-auto">
            <p className="text-gray-700 text-sm text-center">
              <strong className="text-gray-900">Important:</strong> Most storm damage
              isn't visible from the ground. These photos show what a professional
              inspection can reveal.
            </p>
          </div>

          {campaignData.photos.length > 0 ? (
            <PhotoDeck photos={campaignData.photos} />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No photos available for this campaign.</p>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">
              Could Your Roof Be Affected?
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Don't wait for a small problem to become a big expense. Get a free, no-obligation inspection from a local roofing expert.
            </p>
            <ul className="space-y-3 max-w-md mx-auto">
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl flex-shrink-0">✓</span>
                <span className="text-gray-700">Free roof inspection</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl flex-shrink-0">✓</span>
                <span className="text-gray-700">No obligation quote</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl flex-shrink-0">✓</span>
                <span className="text-gray-700">Local, trusted contractor</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl flex-shrink-0">✓</span>
                <span className="text-gray-700">Insurance claim assistance</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Meet the Crew */}
      {branding?.crewMembers && branding.crewMembers.length > 0 && (
        <MeetTheCrew
          members={branding.crewMembers}
          tagline={tagline}
        />
      )}

      {/* Lead Form */}
      <section id="lead-form" className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <LeadForm campaignId={campaignData.id} primaryColor={primaryColor} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 text-sm mb-2">
            Provided by {contractorName}
          </p>
          <p className="text-gray-500 text-xs">
            Powered by Halo Lead Generation
          </p>
        </div>
      </footer>
    </main>
  );
}

export async function generateMetadata({ params }: CampaignPageProps) {
  const { slug } = await params;
  const campaignData = await getCampaignDataBySlugAdmin(slug);

  if (!campaignData) {
    return {
      title: 'Campaign Not Found',
    };
  }

  const campaignName =
    campaignData.campaignName || campaignData.neighborhoodName;
  const location =
    campaignData.showcaseAddress ||
    campaignData.neighborhoodName ||
    campaignName;
  const contractorName = campaignData.contractor.company || campaignData.contractor.name || 'Local Contractor';

  return {
    title: `Storm Damage - ${campaignName} | Halo`,
    description: `View recent roof damage documentation from ${location}. Request a free inspection from ${contractorName}.`,
  };
}
