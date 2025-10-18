import { notFound } from 'next/navigation';
import type { CampaignData } from '@/lib/firestore';
import { getCampaignDataBySlugAdmin, getContractorBrandingAdmin } from '@/lib/firestore-admin';
import HeroCarousel from '@/components/HeroCarousel';
import PhotoDeck from '@/components/PhotoDeck';
import LeadForm from '@/components/LeadForm';
import TrustBadges from '@/components/TrustBadges';
import MeetTheCrew from '@/components/MeetTheCrew';

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

  // Fetch contractor branding
  const branding = await getContractorBrandingAdmin(campaignData.contractorId);

  const location =
    campaignData.showcaseAddress ||
    campaignData.neighborhoodName ||
    campaignData.campaignName;

  const contractorName = campaignData.contractor.company || campaignData.contractor.name || 'Local Contractor';
  const contractorPhone = campaignData.contractor.phone?.trim();
  const contractorEmail = campaignData.contractor.email?.trim();

  // Branding defaults
  const primaryColor = branding?.primaryColor || '#2563eb';
  const tagline = branding?.tagline || 'Professional roofing services from your local experts';

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile: Centered logo, Desktop: Left-aligned */}
            <div className="flex-1 flex justify-center sm:justify-start">
              {branding?.companyLogo && (
                <img
                  src={branding.companyLogo}
                  alt={contractorName}
                  className="h-12 w-auto object-contain"
                />
              )}
              {!branding?.companyLogo && (
                <h1 className="text-xl font-bold text-gray-900">
                  {contractorName}
                </h1>
              )}
            </div>

            {/* Contact Buttons */}
            <div className="flex items-center gap-2">
              {contractorEmail && (
                <a
                  href={`mailto:${contractorEmail}`}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ color: primaryColor }}
                  aria-label="Email contractor"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              )}
              {contractorPhone && (
                <a
                  href={`tel:${contractorPhone}`}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ color: primaryColor }}
                  aria-label="Call contractor"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-4 leading-tight">
              Free Roof Inspections
              <br />
              <span style={{ color: primaryColor }}>{location}</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {tagline}
            </p>

            {/* Trust Signals - Inline */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span className="font-medium">Licensed & Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span className="font-medium">Free Inspection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span className="font-medium">Insurance Assistance</span>
              </div>
            </div>
          </div>

          {/* Hero Carousel */}
          <HeroCarousel />
        </div>
      </section>

      {/* Trust Badges */}
      {branding?.trustBadges && branding.trustBadges.length > 0 && (
        <TrustBadges badges={branding.trustBadges} />
      )}

      {/* Photo Gallery */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 text-center">
            Storm Damage Documentation
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Recent photos from {location}
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

      {/* Meet the Crew */}
      {branding?.crewMembers && branding.crewMembers.length > 0 && (
        <MeetTheCrew members={branding.crewMembers} tagline={branding.tagline} />
      )}

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

      {/* Lead Form */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-3 text-center">
            Request Your <span style={{ color: primaryColor }}>Free Inspection</span>
          </h2>
          <p className="text-gray-600 text-center mb-10">
            Fill out the form below and we'll contact you within 24 hours
          </p>

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
