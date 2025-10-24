'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Settings, X, ArrowLeft, ExternalLink, Copy } from 'lucide-react';

interface Campaign {
  id: string;
  campaignName: string;
  showcaseAddress: string | null;
  jobStatus: 'Completed' | 'Pending' | null;
  campaignStatus: 'Active' | 'Inactive';
  pageSlug: string;
  qrCodeUrl: string | null;
  createdAt: string;
  stormInfo?: {
    enabled: boolean;
    stormDate?: string;
    windSpeed?: string;
    hailSize?: string;
    affectedAreas?: string;
    additionalNotes?: string;
  };
}

interface Photo {
  id: string;
  imageUrl: string;
  uploadOrder: number;
}

interface CampaignDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  onCampaignUpdated?: () => void;
}

type ViewMode = 'details' | 'settings';

export default function CampaignDetailsModal({
  isOpen,
  onClose,
  campaignId,
  onCampaignUpdated,
}: CampaignDetailsModalProps) {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('details');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Settings form state
  const [campaignStatus, setCampaignStatus] = useState<'Active' | 'Inactive'>('Active');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Copy URL state
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setViewMode('details');
      setSuccessMessage(null);
      return;
    }

    const fetchDetails = async () => {
      if (!user) {
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
        setPhotos(data.photos || []);
        setCampaignStatus(data.campaign.campaignStatus || 'Active');
      } catch (err) {
        console.error('Error fetching campaign details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load campaign details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, campaignId, user]);

  const handleSaveSettings = async () => {
    if (!user) return;

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
          campaignStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const data = await response.json();
      setCampaign(data.campaign);
      setSuccessMessage('Settings updated successfully!');

      // Call callback to refresh parent data
      if (onCampaignUpdated) {
        onCampaignUpdated();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 overflow-y-auto">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl border border-[#373e47] bg-[#1e2227] shadow-xl flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#373e47] px-6 py-4 bg-[#2d333b] flex-shrink-0">
          <div className="flex items-center gap-3">
            {viewMode === 'settings' && (
              <button
                onClick={() => setViewMode('details')}
                className="text-gray-400 hover:text-gray-200 transition-colors"
                aria-label="Back to details"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-xl font-semibold text-white">
              {viewMode === 'details' ? 'Campaign Details' : 'Campaign Settings'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === 'details' && (
              <button
                onClick={() => setViewMode('settings')}
                className="text-gray-400 hover:text-cyan-400 transition-colors p-1"
                aria-label="Open settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-cyan-400 text-lg">Loading...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 text-lg">{error}</p>
            </div>
          ) : campaign ? (
            <>
              {viewMode === 'details' ? (
                <div className="space-y-6">
                  {/* Campaign Info */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-white">{campaign.campaignName}</h3>
                    {campaign.showcaseAddress && (
                      <p className="text-gray-400">{campaign.showcaseAddress}</p>
                    )}

                    {/* Status Badges */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div>
                        <span className="text-xs text-gray-400 mr-2">Campaign Status:</span>
                        <span
                          className={`inline-block px-3 py-1 text-sm font-semibold rounded ${
                            campaign.campaignStatus === 'Active'
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}
                        >
                          {campaign.campaignStatus}
                        </span>
                      </div>
                      {campaign.jobStatus && (
                        <div>
                          <span className="text-xs text-gray-400 mr-2">Job Status:</span>
                          <span
                            className={`inline-block px-3 py-1 text-sm font-semibold rounded ${
                              campaign.jobStatus === 'Completed'
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                            }`}
                          >
                            {campaign.jobStatus}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-gray-400 mr-2">Created:</span>
                        <span className="text-sm text-white">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Landing Page URL */}
                  <div className="bg-[#2d333b] border border-[#373e47] rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">Landing Page URL</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-gray-800 px-3 py-2 rounded text-cyan-400 text-sm truncate">
                        {typeof window !== 'undefined' && `${window.location.origin}/c/${campaign.pageSlug}`}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(`${window.location.origin}/c/${campaign.pageSlug}`)
                        }
                        className="flex-shrink-0 bg-[#1e2227] hover:bg-[#2d333b] text-white px-3 py-2 rounded transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <a
                        href={`/c/${campaign.pageSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 bg-[#1e2227] hover:bg-[#2d333b] text-white px-3 py-2 rounded transition-colors"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    {copied && (
                      <p className="text-xs text-green-400 mt-1">Copied to clipboard!</p>
                    )}
                  </div>

                  {/* QR Code */}
                  {campaign.qrCodeUrl && (
                    <div className="bg-[#2d333b] border border-[#373e47] rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-3">QR Code</p>
                      <div className="bg-white inline-block p-3 rounded">
                        <Image
                          src={campaign.qrCodeUrl}
                          alt="QR Code"
                          width={150}
                          height={150}
                        />
                      </div>
                    </div>
                  )}

                  {/* Photos Gallery */}
                  {photos.length > 0 && (
                    <div className="bg-[#2d333b] border border-[#373e47] rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-3">Campaign Photos</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

                  {/* Storm Info if enabled */}
                  {campaign.stormInfo?.enabled && (
                    <div className="bg-[#2d333b] border border-[#373e47] rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-3">Storm Information</p>
                      <div className="space-y-2 text-sm">
                        {campaign.stormInfo.stormDate && (
                          <div>
                            <span className="text-gray-400">Date:</span>{' '}
                            <span className="text-white">{campaign.stormInfo.stormDate}</span>
                          </div>
                        )}
                        {campaign.stormInfo.windSpeed && (
                          <div>
                            <span className="text-gray-400">Wind Speed:</span>{' '}
                            <span className="text-white">{campaign.stormInfo.windSpeed}</span>
                          </div>
                        )}
                        {campaign.stormInfo.hailSize && (
                          <div>
                            <span className="text-gray-400">Hail Size:</span>{' '}
                            <span className="text-white">{campaign.stormInfo.hailSize}</span>
                          </div>
                        )}
                        {campaign.stormInfo.affectedAreas && (
                          <div>
                            <span className="text-gray-400">Affected Areas:</span>{' '}
                            <span className="text-white">{campaign.stormInfo.affectedAreas}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Success/Error Messages */}
                  {successMessage && (
                    <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg">
                      {successMessage}
                    </div>
                  )}
                  {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  {/* Campaign Information (Read-only) */}
                  <div className="bg-[#2d333b] border border-[#373e47] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Campaign Information</h3>
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
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-yellow-500/20 text-yellow-300'
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

                  {/* Campaign Status */}
                  <div className="bg-[#2d333b] border border-[#373e47] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Campaign Status</h3>
                    <div>
                      <label htmlFor="campaignStatus" className="block text-sm font-medium text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        id="campaignStatus"
                        value={campaignStatus}
                        onChange={(e) => setCampaignStatus(e.target.value as 'Active' | 'Inactive')}
                        className="w-full bg-[#1e2227] border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
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

                  {/* Save Button */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setViewMode('details')}
                      className="bg-[#1e2227] hover:bg-[#2d333b] text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveSettings}
                      disabled={saving}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
