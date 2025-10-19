'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

interface Campaign {
  id: string;
  campaignName: string;
  showcaseAddress: string | null;
  jobStatus: 'Completed' | 'Pending' | null;
  campaignStatus: 'Active' | 'Inactive';
  pageSlug: string;
  qrCodeUrl: string | null;
  createdAt: string;
}

interface Photo {
  id: string;
  imageUrl: string;
  uploadOrder: number;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  notes: string | null;
  submittedAt: string;
  jobStatus?: 'new' | 'contacted' | 'scheduled' | 'completed';
  contractorStatus?: 'New' | 'Contacted' | 'Qualified' | 'Closed' | 'Lost';
}

const JOB_STATUS_LABELS: Record<NonNullable<Lead['jobStatus']>, string> = {
  new: 'New',
  contacted: 'Contacted',
  scheduled: 'Scheduled',
  completed: 'Completed',
};

const JOB_STATUS_CLASSES: Record<NonNullable<Lead['jobStatus']>, string> = {
  new: 'bg-gray-700 text-gray-300',
  contacted: 'bg-blue-900/50 text-blue-300',
  scheduled: 'bg-orange-900/50 text-orange-300',
  completed: 'bg-green-900/50 text-green-300',
};

const LEGACY_STATUS_CLASSES: Record<
  NonNullable<Lead['contractorStatus']>,
  string
> = {
  New: 'bg-gray-700 text-gray-300',
  Contacted: 'bg-blue-900/50 text-blue-300',
  Qualified: 'bg-green-900/50 text-green-300',
  Closed: 'bg-purple-900/50 text-purple-300',
  Lost: 'bg-gray-800 text-gray-400',
};

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { user } = useAuth();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!user) {
        setCampaign(null);
        setPhotos([]);
        setLeads([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/dashboard/campaigns/${campaignId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to load campaign details');
        }

        const data = await response.json();
        setCampaign(data.campaign);
        setPhotos(data.photos);
        setLeads(data.leads);
      } catch (err) {
        console.error('Error fetching campaign details:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load campaign details'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [campaignId, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cyan-400 text-xl">Loading campaign...</div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-lg mb-4">
          {error || 'Campaign not found'}
        </p>
        <Link
          href="/dashboard/campaigns"
          className="text-cyan-400 hover:text-cyan-300"
        >
          ← Back to Campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/campaigns"
          className="text-cyan-400 hover:text-cyan-300 text-sm mb-4 inline-block"
        >
          ← Back to Campaigns
        </Link>
        <h1 className="text-3xl font-bold text-white">{campaign.campaignName}</h1>
        <p className="text-gray-400 mt-2">{campaign.showcaseAddress}</p>
      </div>

      {/* Campaign Info Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-400 text-sm mb-1">Job Status</p>
            <span
              className={`inline-block px-3 py-1 text-sm font-semibold rounded ${
                campaign.jobStatus === 'Completed'
                  ? 'bg-green-900/50 text-green-300'
                  : 'bg-yellow-900/50 text-yellow-300'
              }`}
            >
              {campaign.jobStatus || 'N/A'}
            </span>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-1">Campaign Status</p>
            <span
              className={`inline-block px-3 py-1 text-sm font-semibold rounded ${
                campaign.campaignStatus === 'Active'
                  ? 'bg-cyan-900/50 text-cyan-300'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {campaign.campaignStatus || 'Active'}
            </span>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-1">Total Leads</p>
            <p className="text-2xl font-bold text-cyan-400">{leads.length}</p>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-1">Created</p>
            <p className="text-white">
              {campaign.createdAt
                ? new Date(campaign.createdAt).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-800">
          <p className="text-gray-400 text-sm mb-2">Landing Page URL</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-gray-800 px-4 py-2 rounded text-cyan-400 text-sm">
              {typeof window !== 'undefined' && `${window.location.origin}/c/${campaign.pageSlug}`}
            </code>
            <a
              href={`/c/${campaign.pageSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
            >
              View
            </a>
          </div>
        </div>

        {campaign.qrCodeUrl && (
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-gray-400 text-sm mb-2">QR Code</p>
            <div className="bg-white inline-block p-4 rounded">
              <Image
                src={campaign.qrCodeUrl}
                alt="QR Code"
                width={150}
                height={150}
              />
            </div>
          </div>
        )}
      </div>

      {/* Photos Gallery */}
      {photos.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Campaign Photos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-800"
              >
                <Image
                  src={photo.imageUrl}
                  alt={`Photo ${photo.uploadOrder}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Leads ({leads.length})
        </h2>

        {leads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => router.push(`/dashboard/campaigns/${campaignId}/leads/${lead.id}`)}
                    className="hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {lead.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {lead.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {lead.phone}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {lead.address || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        if (lead.jobStatus) {
                          const status = lead.jobStatus;
                          return (
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded ${JOB_STATUS_CLASSES[status]}`}
                            >
                              {JOB_STATUS_LABELS[status]}
                            </span>
                          );
                        }

                        const legacyStatus = lead.contractorStatus ?? 'New';
                        return (
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${LEGACY_STATUS_CLASSES[legacyStatus]}`}
                          >
                            {legacyStatus}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(lead.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                      <div className="flex space-x-3">
                        <a
                          href={`tel:${lead.phone}`}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          Call
                        </a>
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          Email
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-400 text-sm">
            No leads yet. Share your QR campaign link to start collecting leads.
          </div>
        )}
      </div>
    </div>
  );
}
