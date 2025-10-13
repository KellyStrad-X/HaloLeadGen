'use client';

import { useState } from 'react';
import { Campaign } from '@/lib/firestore';

interface SuccessPageClientProps {
  campaign: Campaign;
  landingPageUrl: string;
}

export default function SuccessPageClient({
  campaign,
  landingPageUrl,
}: SuccessPageClientProps) {
  const [copied, setCopied] = useState(false);

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

    // Create temporary link and trigger download
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
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-halo-dark-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-white">
            Halo <span className="text-halo-ice">Lead Gen</span>
          </h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-halo-dark to-black py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-white"
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

          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Your Campaign is <span className="text-halo-ice">Live!</span>
          </h2>
          <p className="text-xl text-halo-light mb-2">
            {campaign.neighborhoodName}
          </p>
          <p className="text-halo-medium max-w-2xl mx-auto">
            Your custom QR code and landing page are ready. Download your assets
            below and start distributing them in your target area.
          </p>
        </div>
      </section>

      {/* Campaign Summary */}
      <section className="py-8 px-4 bg-halo-dark">
        <div className="max-w-4xl mx-auto">
          <div className="bg-halo-dark-light border border-halo-dark-light rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Campaign Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-halo-medium mb-1">Neighborhood</p>
                <p className="text-white font-semibold">
                  {campaign.neighborhoodName}
                </p>
              </div>
              <div>
                <p className="text-halo-medium mb-1">Status</p>
                <p className="text-green-400 font-semibold capitalize">
                  {campaign.status}
                </p>
              </div>
              <div>
                <p className="text-halo-medium mb-1">Created</p>
                <p className="text-white">
                  {new Date(campaign.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-halo-medium mb-1">Campaign ID</p>
                <p className="text-white font-mono text-xs">{campaign.id}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QR Code Section */}
      {campaign.qrCodeUrl && (
        <section className="py-12 px-4 bg-black">
          <div className="max-w-4xl mx-auto">
            <div className="bg-halo-dark-light border border-halo-dark-light rounded-lg p-8">
              <h3 className="text-2xl font-bold text-white mb-2 text-center">
                Your Custom QR Code
              </h3>
              <p className="text-halo-medium text-center mb-8">
                Print this QR code and distribute it in{' '}
                {campaign.neighborhoodName}
              </p>

              {/* QR Code Display */}
              <div className="bg-white p-8 rounded-lg w-fit mx-auto mb-6">
                <img
                  src={campaign.qrCodeUrl}
                  alt={`QR Code for ${campaign.neighborhoodName}`}
                  className="w-64 h-64 sm:w-80 sm:h-80"
                />
              </div>

              {/* Download Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleDownloadQR}
                  className="px-8 py-4 bg-halo-ice text-black font-bold rounded-lg hover:bg-halo-ice/90 transition-colors flex items-center gap-2"
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
                  Download QR Code (1024x1024px)
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Landing Page URL */}
      <section className="py-12 px-4 bg-halo-dark">
        <div className="max-w-4xl mx-auto">
          <div className="bg-halo-dark-light border border-halo-dark-light rounded-lg p-8">
            <h3 className="text-2xl font-bold text-white mb-2 text-center">
              Landing Page URL
            </h3>
            <p className="text-halo-medium text-center mb-6">
              Share this link or use the QR code to direct homeowners here
            </p>

            {/* URL Display */}
            <div className="bg-black border border-halo-dark rounded-lg p-4 mb-4">
              <p className="text-halo-ice text-center font-mono text-sm break-all">
                {landingPageUrl}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleCopyUrl}
                className={`px-6 py-3 ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-halo-dark text-halo-ice border border-halo-ice'
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
                className="px-6 py-3 bg-halo-ice text-black font-semibold rounded-lg hover:bg-halo-ice/90 transition-colors flex items-center justify-center gap-2"
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
                Preview Landing Page
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-12 px-4 bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="bg-halo-dark-light border border-halo-dark-light rounded-lg p-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Next Steps
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Step 1 */}
              <div className="bg-halo-dark border border-halo-dark rounded-lg p-6">
                <div className="w-10 h-10 bg-halo-ice text-black font-bold rounded-full flex items-center justify-center mb-4">
                  1
                </div>
                <h4 className="text-lg font-bold text-white mb-2">
                  Print Your QR Code
                </h4>
                <p className="text-halo-light text-sm">
                  Download and print the QR code on door hangers, yard signs,
                  flyers, or postcards. Recommended size: 2" x 2" minimum.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-halo-dark border border-halo-dark rounded-lg p-6">
                <div className="w-10 h-10 bg-halo-ice text-black font-bold rounded-full flex items-center justify-center mb-4">
                  2
                </div>
                <h4 className="text-lg font-bold text-white mb-2">
                  Distribute in Target Area
                </h4>
                <p className="text-halo-light text-sm">
                  Focus on {campaign.neighborhoodName}. Place materials where
                  homeowners will see them - front doors, mailboxes, community
                  boards.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-halo-dark border border-halo-dark rounded-lg p-6">
                <div className="w-10 h-10 bg-halo-ice text-black font-bold rounded-full flex items-center justify-center mb-4">
                  3
                </div>
                <h4 className="text-lg font-bold text-white mb-2">
                  Monitor Lead Notifications
                </h4>
                <p className="text-halo-light text-sm">
                  Leads will be sent to your email. Check regularly and respond
                  within 24 hours for best conversion rates.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-halo-dark border border-halo-dark rounded-lg p-6">
                <div className="w-10 h-10 bg-halo-ice text-black font-bold rounded-full flex items-center justify-center mb-4">
                  4
                </div>
                <h4 className="text-lg font-bold text-white mb-2">
                  Follow Up Quickly
                </h4>
                <p className="text-halo-light text-sm">
                  When homeowners submit their info, contact them promptly to
                  schedule inspections. Fast response = higher close rates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="py-12 px-4 bg-halo-dark">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <a
            href="/create-campaign"
            className="inline-block px-8 py-4 bg-halo-ice text-black font-bold rounded-lg hover:bg-halo-ice/90 transition-colors"
          >
            Create Another Campaign
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-halo-dark-light py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-halo-medium text-sm">
            Powered by Halo Lead Generation
          </p>
        </div>
      </footer>
    </main>
  );
}
