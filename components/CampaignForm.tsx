'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import PhotoUpload from './PhotoUpload';

interface StormInfo {
  enabled: boolean;
  stormDate: string;
  windSpeed: string;
  hailSize: string;
  affectedAreas: string;
  additionalNotes: string;
}

interface CampaignInfo {
  campaignName: string;
  homeownerName: string;
  showcaseAddress: string;
  qrDisplayName: string;
  jobStatus: 'Completed' | 'Pending';
  stormInfo: StormInfo;
}

interface FormErrors {
  [key: string]: string;
}

export default function CampaignForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  // Form data
  const [campaignInfo, setCampaignInfo] = useState<CampaignInfo>({
    campaignName: '',
    homeownerName: '',
    showcaseAddress: '',
    qrDisplayName: '',
    jobStatus: 'Completed',
    stormInfo: {
      enabled: false,
      stormDate: '',
      windSpeed: '',
      hailSize: '',
      affectedAreas: '',
      additionalNotes: '',
    },
  });

  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  // Validate campaign info
  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!campaignInfo.campaignName.trim()) {
      newErrors.campaignName = 'Campaign name is required';
    }

    if (!campaignInfo.showcaseAddress.trim()) {
      newErrors.showcaseAddress = 'Address is required';
    } else if (campaignInfo.showcaseAddress.trim().length < 10) {
      newErrors.showcaseAddress = 'Please provide a complete address';
    }

    if (!campaignInfo.qrDisplayName.trim()) {
      newErrors.qrDisplayName = 'QR display name is required';
    }

    if (campaignInfo.stormInfo.enabled && !campaignInfo.stormInfo.stormDate) {
      newErrors.stormDate = 'Storm date is required when storm info is enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof CampaignInfo, value: string) => {
    setCampaignInfo((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Handle storm info changes
  const handleStormInfoChange = (field: keyof StormInfo, value: string | boolean) => {
    setCampaignInfo((prev) => ({
      ...prev,
      stormInfo: {
        ...prev.stormInfo,
        [field]: value,
      },
    }));

    if (field === 'stormDate' && errors.stormDate) {
      setErrors((prev) => ({ ...prev, stormDate: '' }));
    }

    if (field === 'enabled' && value === false && errors.stormDate) {
      setErrors((prev) => ({ ...prev, stormDate: '' }));
    }
  };

  // Handle step 1 submission (campaign info)
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep1()) {
      return;
    }

    if (!user) {
      setErrors({ submit: 'You must be logged in to create a campaign' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user's ID token
      const token = await user.getIdToken();

      // Create campaign with auth
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaignName: campaignInfo.campaignName,
          homeownerName: campaignInfo.homeownerName || undefined,
          showcaseAddress: campaignInfo.showcaseAddress,
          qrDisplayName: campaignInfo.qrDisplayName,
          jobStatus: campaignInfo.jobStatus,
          stormInfo: campaignInfo.stormInfo.enabled
            ? {
                ...campaignInfo.stormInfo,
                stormDate: campaignInfo.stormInfo.stormDate,
                windSpeed: campaignInfo.stormInfo.windSpeed.trim(),
                hailSize: campaignInfo.stormInfo.hailSize.trim(),
                affectedAreas: campaignInfo.stormInfo.affectedAreas.trim(),
                additionalNotes: campaignInfo.stormInfo.additionalNotes.trim(),
              }
            : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create campaign');
      }

      const data = await response.json();
      setCampaignId(data.campaignId);
      setStep(2); // Move to photo upload
    } catch (error) {
      console.error('Error creating campaign:', error);
      setErrors({
        submit:
          error instanceof Error ? error.message : 'Failed to create campaign',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle photo upload completion
  const handlePhotosUploaded = (photoUrls: string[]) => {
    setUploadedPhotos(photoUrls);
    setStep(3); // Move to review/completion
  };

  // Render step 1: Campaign Info
  const renderStep1 = () => (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-8 shadow-lg">
      <div className="mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-cyan-400 text-black flex items-center justify-center font-bold">
              1
            </div>
            <div className="w-20 h-1 bg-gray-700"></div>
            <div className="w-8 h-8 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center">
              2
            </div>
            <div className="w-20 h-1 bg-gray-700"></div>
            <div className="w-8 h-8 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center">
              3
            </div>
          </div>
        </div>
        <p className="text-center text-gray-400 text-sm">
          Step 1 of 3: Campaign Information
        </p>
      </div>

      <form onSubmit={handleStep1Submit} className="space-y-6">
        {/* Campaign Name */}
        <div>
          <label
            htmlFor="campaignName"
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            Campaign Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="campaignName"
            value={campaignInfo.campaignName}
            onChange={(e) => handleInputChange('campaignName', e.target.value)}
            className={`w-full px-4 py-3 bg-slate-900/60 border ${
              errors.campaignName ? 'border-red-500' : 'border-slate-600'
            } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
            placeholder="e.g., John Bryan's Campaign"
          />
          {errors.campaignName && (
            <p className="mt-1 text-sm text-red-400">{errors.campaignName}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            This is how you'll identify the campaign in your dashboard
          </p>
        </div>

        {/* Homeowner Name (Optional) */}
        <div>
          <label
            htmlFor="homeownerName"
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            Homeowner Name (Optional)
          </label>
          <input
            type="text"
            id="homeownerName"
            value={campaignInfo.homeownerName}
            onChange={(e) => handleInputChange('homeownerName', e.target.value)}
            className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="e.g., John Bryan"
          />
          <p className="mt-1 text-sm text-gray-500">
            For your reference only (not shown publicly)
          </p>
        </div>

        {/* Showcase Address */}
        <div>
          <label
            htmlFor="showcaseAddress"
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            Showcase Property Address <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="showcaseAddress"
            value={campaignInfo.showcaseAddress}
            onChange={(e) => handleInputChange('showcaseAddress', e.target.value)}
            className={`w-full px-4 py-3 bg-slate-900/60 border ${
              errors.showcaseAddress ? 'border-red-500' : 'border-slate-600'
            } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
            placeholder="e.g., 123 Oak Street, Denver, CO 80202"
          />
          {errors.showcaseAddress && (
            <p className="mt-1 text-sm text-red-400">{errors.showcaseAddress}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            For your reference only (not shown publicly)
          </p>
        </div>

        {/* QR Display Name */}
        <div>
          <label
            htmlFor="qrDisplayName"
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            QR Display Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="qrDisplayName"
            value={campaignInfo.qrDisplayName}
            onChange={(e) => handleInputChange('qrDisplayName', e.target.value)}
            className={`w-full px-4 py-3 bg-slate-900/60 border ${
              errors.qrDisplayName ? 'border-red-500' : 'border-slate-600'
            } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
            placeholder="e.g., Oak Ridge Subdivision, Maple Heights Area"
          />
          {errors.qrDisplayName && (
            <p className="mt-1 text-sm text-red-400">{errors.qrDisplayName}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Shown on QR page (do NOT use homeowner name or exact address)
          </p>
        </div>

        {/* Job Status */}
        <div>
          <label
            htmlFor="jobStatus"
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            Job Status <span className="text-red-400">*</span>
          </label>
          <select
            id="jobStatus"
            value={campaignInfo.jobStatus}
            onChange={(e) => handleInputChange('jobStatus', e.target.value as 'Completed' | 'Pending')}
            className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="Completed">Completed - Work finished</option>
            <option value="Pending">Pending - Contract signed, work in progress</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Current status of the roofing work
          </p>
        </div>

        {/* Storm Info Section */}
        <div className="border-t border-slate-600 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-200">Storm Information (Optional)</h3>
              <p className="text-sm text-gray-500">Add storm details to create urgency and demonstrate expertise</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={campaignInfo.stormInfo.enabled}
                onChange={(e) => handleStormInfoChange('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {campaignInfo.stormInfo.enabled && (
            <div className="space-y-4 pl-4 border-l-2 border-cyan-500">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Storm Date
                  </label>
                <input
                  type="date"
                  value={campaignInfo.stormInfo.stormDate}
                  onChange={(e) => handleStormInfoChange('stormDate', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                {errors.stormDate && (
                  <p className="mt-1 text-sm text-red-400">{errors.stormDate}</p>
                )}
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Wind Speed
                  </label>
                  <input
                    type="text"
                    value={campaignInfo.stormInfo.windSpeed}
                    onChange={(e) => handleStormInfoChange('windSpeed', e.target.value)}
                    placeholder="e.g., 70 mph"
                    className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Hail Size
                </label>
                <input
                  type="text"
                  value={campaignInfo.stormInfo.hailSize}
                  onChange={(e) => handleStormInfoChange('hailSize', e.target.value)}
                  placeholder="e.g., Golf ball, 1.5 inches"
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Affected Areas
                </label>
                <input
                  type="text"
                  value={campaignInfo.stormInfo.affectedAreas}
                  onChange={(e) => handleStormInfoChange('affectedAreas', e.target.value)}
                  placeholder="e.g., Northeast Denver, Highlands Ranch"
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={campaignInfo.stormInfo.additionalNotes}
                  onChange={(e) => handleStormInfoChange('additionalNotes', e.target.value)}
                  placeholder="Any additional storm details..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {errors.submit && (
          <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-200">{errors.submit}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-4 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating Campaign...' : 'Continue to Photo Upload'}
        </button>
      </form>
    </div>
  );

  // Render step 2: Photo Upload
  const renderStep2 = () => (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-8 shadow-lg">
      <div className="mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
              ✓
            </div>
            <div className="w-20 h-1 bg-cyan-400"></div>
            <div className="w-8 h-8 rounded-full bg-cyan-400 text-black flex items-center justify-center font-bold">
              2
            </div>
            <div className="w-20 h-1 bg-gray-700"></div>
            <div className="w-8 h-8 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center">
              3
            </div>
          </div>
        </div>
        <p className="text-center text-gray-400 text-sm">
          Step 2 of 3: Upload Photos
        </p>
      </div>

      {campaignId && (
        <PhotoUpload
          campaignId={campaignId}
          onUploadComplete={handlePhotosUploaded}
        />
      )}
    </div>
  );

  // Render step 3: Processing/Redirect
  const renderStep3 = () => (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
      <div className="mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
              ✓
            </div>
            <div className="w-20 h-1 bg-cyan-400"></div>
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
              ✓
            </div>
            <div className="w-20 h-1 bg-cyan-400"></div>
            <div className="w-8 h-8 rounded-full bg-cyan-400 text-black flex items-center justify-center font-bold">
              3
            </div>
          </div>
        </div>
        <p className="text-center text-gray-400 text-sm">
          Step 3 of 3: Generating QR Code
        </p>
      </div>

      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mx-auto mb-4"></div>
      <h3 className="text-2xl font-bold text-white mb-2">
        Creating Your Campaign...
      </h3>
      <p className="text-gray-400">
        Generating QR code and setting up your landing page
      </p>
    </div>
  );

  return (
    <>
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </>
  );
}
