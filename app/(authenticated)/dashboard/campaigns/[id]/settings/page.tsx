'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface Campaign {
  id: string;
  campaignName: string;
  showcaseAddress: string | null;
  jobStatus: 'Completed' | 'Pending' | null;
  campaignStatus: 'Active' | 'Inactive';
  serviceRadiusMiles?: number;
  stormInfo?: {
    enabled: boolean;
    stormDate?: string;
    windSpeed?: string;
    hailSize?: string;
    affectedAreas?: string;
    additionalNotes?: string;
  };
}

export default function CampaignSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [serviceRadiusMiles, setServiceRadiusMiles] = useState(5);
  const [campaignStatus, setCampaignStatus] = useState<'Active' | 'Inactive'>('Active');

  useEffect(() => {
    const fetchCampaign = async () => {
      if (authLoading) {
        return;
      }

      if (!user) {
        setLoading(false);
        setError('You must be signed in to manage campaign settings.');
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/dashboard/campaigns/${campaignId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 404) {
          throw new Error('Campaign not found');
        }

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to load campaign');
        }

        const data = await response.json();
        setCampaign(data.campaign);
        setServiceRadiusMiles(data.campaign.serviceRadiusMiles || 5);
        setCampaignStatus(data.campaign.campaignStatus || 'Active');
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError(err instanceof Error ? err.message : 'Failed to load campaign');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [authLoading, campaignId, user]);

  const handleSave = async () => {
    if (!user || authLoading) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/campaigns/${campaignId}/settings`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceRadiusMiles,
          campaignStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const data = await response.json();
      setCampaign(data.campaign);
      setSuccessMessage('Settings updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cyan-400 text-xl">Loading settings...</div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <Link
          href={`/dashboard/campaigns/${campaignId}`}
          className="text-cyan-400 hover:text-cyan-300"
        >
          ← Back to Campaign
        </Link>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg mb-4">Campaign not found</p>
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/campaigns/${campaignId}`}
          className="text-cyan-400 hover:text-cyan-300 text-sm mb-4 inline-block"
        >
          ← Back to Campaign
        </Link>
        <h1 className="text-3xl font-bold text-white">Campaign Settings</h1>
        <p className="text-gray-400 mt-1">{campaign.campaignName}</p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Halo Map Settings */}
      <div className="bg-[#2d333b] border border-[#373e47] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Halo Map Settings</h2>

        <div className="space-y-6">
          <div>
            <label htmlFor="serviceRadius" className="block text-sm font-medium text-gray-300 mb-2">
              Service Radius
            </label>
            <select
              id="serviceRadius"
              value={serviceRadiusMiles}
              onChange={(e) => setServiceRadiusMiles(Number(e.target.value))}
              className="w-full md:w-1/2 bg-[#1e2227] border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value={3}>3 miles - Dense urban area</option>
              <option value={5}>5 miles - Standard (recommended)</option>
              <option value={10}>10 miles - Suburban area</option>
              <option value={15}>15 miles - Rural area</option>
            </select>
            <p className="text-gray-400 text-sm mt-2">
              Controls which leads appear on this campaign's public map. All your completed/scheduled jobs within this radius will be shown.
            </p>
          </div>

          <div className="p-4 bg-[#1e2227]/50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">How it works:</h3>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>
                • The Halo Map shows approximate locations of your completed and scheduled jobs
              </li>
              <li>
                • Only leads who opted into map display will appear (privacy-friendly)
              </li>
              <li>
                • Leads within the selected radius of THIS campaign's address will be shown
              </li>
              <li>
                • Green markers = completed jobs, Orange markers = scheduled jobs
              </li>
              <li>
                • Provides social proof to prospects visiting your campaign page
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Campaign Status */}
      <div className="bg-[#2d333b] border border-[#373e47] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Campaign Status</h2>

        <div>
          <label htmlFor="campaignStatus" className="block text-sm font-medium text-gray-300 mb-2">
            Status
          </label>
          <select
            id="campaignStatus"
            value={campaignStatus}
            onChange={(e) => setCampaignStatus(e.target.value as 'Active' | 'Inactive')}
            className="w-full md:w-1/2 bg-[#1e2227] border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="Active">Active - Campaign page is public</option>
            <option value="Inactive">Inactive - Campaign page is hidden</option>
          </select>
          <p className="text-gray-400 text-sm mt-2">
            {campaignStatus === 'Active'
              ? 'Your campaign page is live and accessible to the public'
              : 'Your campaign page is hidden from the public. Leads cannot submit via this campaign.'}
          </p>
        </div>
      </div>

      {/* Campaign Info (Read-only) */}
      <div className="bg-[#2d333b] border border-[#373e47] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Campaign Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Campaign Name
            </label>
            <p className="text-white">{campaign.campaignName}</p>
          </div>

          {campaign.showcaseAddress && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Showcase Address
              </label>
              <p className="text-white">{campaign.showcaseAddress}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Job Status
            </label>
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

          {campaign.stormInfo?.enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Storm Information
              </label>
              <div className="bg-[#1e2227] rounded-lg p-3 space-y-1 text-sm">
                {campaign.stormInfo.stormDate && (
                  <p className="text-gray-300">
                    <span className="text-gray-400">Date:</span> {campaign.stormInfo.stormDate}
                  </p>
                )}
                {campaign.stormInfo.windSpeed && (
                  <p className="text-gray-300">
                    <span className="text-gray-400">Wind Speed:</span> {campaign.stormInfo.windSpeed}
                  </p>
                )}
                {campaign.stormInfo.hailSize && (
                  <p className="text-gray-300">
                    <span className="text-gray-400">Hail Size:</span> {campaign.stormInfo.hailSize}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Link
          href={`/dashboard/campaigns/${campaignId}`}
          className="bg-[#1e2227] hover:bg-[#2d333b] text-white px-6 py-3 rounded-lg transition-colors"
        >
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
