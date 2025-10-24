'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import CampaignForm from './CampaignForm';
import CampaignSuccess from './CampaignSuccess';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateCampaignModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCampaignModalProps) {
  const [completedCampaignId, setCompletedCampaignId] = useState<string | null>(null);

  // Reset state when modal closes
  const handleClose = () => {
    setCompletedCampaignId(null);
    onClose();
  };

  // Handle campaign completion
  const handleCampaignComplete = (campaignId: string) => {
    setCompletedCampaignId(campaignId);
    if (onSuccess) {
      onSuccess();
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
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {completedCampaignId ? (
                <>Your Campaign is <span className="text-cyan-400">Ready!</span></>
              ) : (
                <>Create New <span className="text-cyan-400">Campaign</span></>
              )}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {completedCampaignId
                ? 'Download your QR code and start generating leads'
                : 'Set up a campaign to capture roofing leads from your showcase property'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-200 transition-colors flex-shrink-0 ml-4"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {completedCampaignId ? (
            <CampaignSuccess campaignId={completedCampaignId} onClose={handleClose} />
          ) : (
            <CampaignForm onSuccess={handleCampaignComplete} />
          )}
        </div>
      </div>
    </div>
  );
}
