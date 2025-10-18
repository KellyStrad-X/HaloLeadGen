import { notFound } from 'next/navigation';
import type { CampaignData } from '@/lib/firestore';
import { getCampaignDataBySlugAdmin } from '@/lib/firestore-admin';
import PhotoGallery from '@/components/PhotoGallery';
import LeadForm from '@/components/LeadForm';

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

  const location =
    campaignData.showcaseAddress ||
    campaignData.neighborhoodName ||
    campaignData.campaignName;

  const contractorName = campaignData.contractor.company || campaignData.contractor.name || 'Local Contractor';
  const contractorPhone = campaignData.contractor.phone?.trim();

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {contractorName}
              </h1>
            </div>
            {contractorPhone && (
              <div className="text-right">
                <a
                  href={`tel:${contractorPhone}`}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {contractorPhone}
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-4 leading-tight">
            Free Roof Inspections
            <br />
            <span className="text-blue-600">{location}</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Professional roofing services from your local experts
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
      </section>

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
            <PhotoGallery photos={campaignData.photos} />
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

      {/* Lead Form */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-3 text-center">
            Request Your <span className="text-blue-600">Free Inspection</span>
          </h2>
          <p className="text-gray-600 text-center mb-10">
            Fill out the form below and we'll contact you within 24 hours
          </p>

          <LeadForm campaignId={campaignData.id} />
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
