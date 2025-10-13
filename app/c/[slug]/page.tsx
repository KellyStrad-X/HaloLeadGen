import { notFound } from 'next/navigation';
import { getDb, type Campaign, type Contractor, type Photo } from '@/lib/db';
import PhotoGallery from '@/components/PhotoGallery';
import LeadForm from '@/components/LeadForm';

interface CampaignPageProps {
  params: {
    slug: string;
  };
}

interface CampaignData extends Campaign {
  contractor: Contractor;
  photos: Photo[];
}

async function getCampaignData(slug: string): Promise<CampaignData | null> {
  const db = getDb();

  // Fetch campaign by slug with contractor info
  const campaign = db.prepare(`
    SELECT
      c.*,
      co.name as contractor_name,
      co.company as contractor_company,
      co.email as contractor_email,
      co.phone as contractor_phone
    FROM campaigns c
    JOIN contractors co ON c.contractor_id = co.id
    WHERE c.page_slug = ? AND c.status = 'active'
  `).get(slug) as any;

  if (!campaign) {
    return null;
  }

  // Fetch photos for this campaign
  const photos = db.prepare(`
    SELECT * FROM photos
    WHERE campaign_id = ?
    ORDER BY upload_order ASC
  `).all(campaign.id) as Photo[];

  return {
    id: campaign.id,
    contractor_id: campaign.contractor_id,
    neighborhood_name: campaign.neighborhood_name,
    page_slug: campaign.page_slug,
    qr_code_path: campaign.qr_code_path,
    created_at: campaign.created_at,
    status: campaign.status,
    contractor: {
      id: campaign.contractor_id,
      name: campaign.contractor_name,
      company: campaign.contractor_company,
      email: campaign.contractor_email,
      phone: campaign.contractor_phone,
      created_at: '',
    },
    photos,
  };
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const campaignData = await getCampaignData(params.slug);

  if (!campaignData) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-halo-dark-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Halo <span className="text-halo-ice">Lead Gen</span>
              </h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-halo-medium">{campaignData.contractor.company}</p>
              <p className="text-xs text-halo-medium">{campaignData.contractor.phone}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-halo-dark to-black py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Real Roof Damage From
            <br />
            <span className="text-halo-ice">Your Neighborhood</span>
          </h2>
          <p className="text-xl text-halo-light mb-2">
            {campaignData.neighborhood_name}
          </p>
          <p className="text-halo-medium max-w-2xl mx-auto">
            We've documented recent storm damage in your area. See if your roof might need inspection.
          </p>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="py-12 px-4 bg-halo-dark">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-2 text-center">
            Storm Damage Documentation
          </h3>
          <p className="text-halo-medium text-center mb-8">
            Recent photos from {campaignData.neighborhood_name}
          </p>

          {campaignData.photos.length > 0 ? (
            <PhotoGallery photos={campaignData.photos} />
          ) : (
            <div className="text-center py-12">
              <p className="text-halo-medium">No photos available for this campaign.</p>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-8 px-4 bg-gradient-to-b from-halo-dark to-black">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-halo-dark-light border border-halo-ice/20 rounded-lg p-6 mb-8">
            <h3 className="text-2xl font-bold text-white mb-3">
              Could Your Roof Be Affected?
            </h3>
            <p className="text-halo-light mb-4">
              Don't wait for a small problem to become a big expense. Get a free, no-obligation inspection from a local roofing expert.
            </p>
            <ul className="text-left text-halo-light space-y-2 max-w-md mx-auto">
              <li className="flex items-start">
                <span className="text-halo-ice mr-2">✓</span>
                <span>Free roof inspection</span>
              </li>
              <li className="flex items-start">
                <span className="text-halo-ice mr-2">✓</span>
                <span>No obligation quote</span>
              </li>
              <li className="flex items-start">
                <span className="text-halo-ice mr-2">✓</span>
                <span>Local, trusted contractor</span>
              </li>
              <li className="flex items-start">
                <span className="text-halo-ice mr-2">✓</span>
                <span>Insurance claim assistance</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Lead Form */}
      <section className="py-12 px-4 bg-black">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold text-white mb-2 text-center">
            Request Your <span className="text-halo-ice">Free Inspection</span>
          </h3>
          <p className="text-halo-medium text-center mb-8">
            Fill out the form below and we'll contact you within 24 hours
          </p>

          <LeadForm campaignId={campaignData.id} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-halo-dark-light py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-halo-medium text-sm mb-2">
            Provided by {campaignData.contractor.company}
          </p>
          <p className="text-halo-medium text-xs">
            Powered by Halo Lead Generation
          </p>
        </div>
      </footer>
    </main>
  );
}

export async function generateMetadata({ params }: CampaignPageProps) {
  const campaignData = await getCampaignData(params.slug);

  if (!campaignData) {
    return {
      title: 'Campaign Not Found',
    };
  }

  return {
    title: `Storm Damage - ${campaignData.neighborhood_name} | Halo`,
    description: `View recent roof damage documentation from ${campaignData.neighborhood_name}. Request a free inspection from ${campaignData.contractor.company}.`,
  };
}
