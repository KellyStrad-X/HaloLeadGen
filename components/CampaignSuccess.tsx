'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Campaign } from '@/lib/firestore';

interface CampaignSuccessProps {
  campaignId: string;
  onClose?: () => void;
}

export default function CampaignSuccess({
  campaignId,
  onClose,
}: CampaignSuccessProps) {
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/dashboard/campaigns/${campaignId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCampaign(data.campaign);
        }
      } catch (error) {
        console.error('Error fetching campaign:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Failed to load campaign details</p>
      </div>
    );
  }

  const landingPageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/c/${campaign.pageSlug}`;
  const campaignName = campaign.campaignName || campaign.neighborhoodName;
  const location = campaign.showcaseAddress || campaign.neighborhoodName || campaignName;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(landingPageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleDownloadQR = () => {
    if (!campaign.qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = campaign.qrCodeUrl;
    link.download = `halo-qr-${campaign.pageSlug}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = () => {
    window.open(landingPageUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-3xl font-bold text-white mb-2">
          Campaign <span className="text-cyan-400">Live!</span>
        </h3>
        <p className="text-gray-400">{location}</p>
      </div>

      {/* QR Code Section */}
      {campaign.qrCodeUrl && (
        <div className="bg-[#0d1117]/60 border border-[#373e47] rounded-lg p-6">
          <h4 className="text-lg font-bold text-white mb-4 text-center">
            Your Custom QR Code
          </h4>

          {/* QR Code Display */}
          <div className="bg-white p-6 rounded-lg w-fit mx-auto mb-4">
            <img
              src={campaign.qrCodeUrl}
              alt={`QR Code for ${campaignName}`}
              className="w-48 h-48"
            />
          </div>

          {/* Download Button */}
          <div className="flex justify-center">
            <button
              onClick={handleDownloadQR}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download QR Code
            </button>
          </div>
        </div>
      )}

      {/* Landing Page URL */}
      <div className="bg-[#0d1117]/60 border border-[#373e47] rounded-lg p-6">
        <h4 className="text-lg font-bold text-white mb-4 text-center">
          Landing Page URL
        </h4>

        {/* URL Display */}
        <div className="bg-[#0d1117] border border-[#444c56] rounded-lg p-3 mb-4">
          <p className="text-cyan-400 text-center font-mono text-sm break-all">
            {landingPageUrl}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleCopyUrl}
            className={`px-6 py-2 ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-[#2d333b] text-cyan-400 border border-cyan-400'
            } font-semibold rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2`}
          >
            {copied ? (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy URL
              </>
            )}
          </button>

          <button
            onClick={handlePreview}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Preview Page
          </button>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-[#0d1117]/60 border border-[#373e47] rounded-lg p-6">
        <h4 className="text-lg font-bold text-white mb-4 text-center">
          Next Steps
        </h4>
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-cyan-400 text-black rounded-full flex items-center justify-center font-bold text-xs">
              1
            </div>
            <p>Download and print your QR code on door hangers, yard signs, or flyers</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-cyan-400 text-black rounded-full flex items-center justify-center font-bold text-xs">
              2
            </div>
            <p>Distribute materials in {location}</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-cyan-400 text-black rounded-full flex items-center justify-center font-bold text-xs">
              3
            </div>
            <p>Monitor lead notifications in your email and dashboard</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-cyan-400 text-black rounded-full flex items-center justify-center font-bold text-xs">
              4
            </div>
            <p>Follow up with leads quickly for best conversion rates</p>
          </div>
        </div>
      </div>

      {/* Close Button */}
      {onClose && (
        <div className="text-center pt-4">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
