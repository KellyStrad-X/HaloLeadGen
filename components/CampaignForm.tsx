'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PhotoUpload from './PhotoUpload';

interface ContractorInfo {
  name: string;
  company: string;
  email: string;
  phone: string;
  neighborhoodName: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function CampaignForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  // Form data
  const [contractorInfo, setContractorInfo] = useState<ContractorInfo>({
    name: '',
    company: '',
    email: '',
    phone: '',
    neighborhoodName: '',
  });

  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  // Validate contractor info
  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!contractorInfo.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!contractorInfo.company.trim()) {
      newErrors.company = 'Company name is required';
    }

    if (!contractorInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contractorInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!contractorInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\(\)\+]+$/.test(contractorInfo.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!contractorInfo.neighborhoodName.trim()) {
      newErrors.neighborhoodName = 'Neighborhood/area name is required';
    } else if (contractorInfo.neighborhoodName.trim().length < 10) {
      newErrors.neighborhoodName =
        'Please be specific (e.g., "Oak Ridge Subdivision, Dallas TX")';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof ContractorInfo, value: string) => {
    setContractorInfo((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Handle step 1 submission (contractor info)
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep1()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create campaign with contractor info
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractorInfo),
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

  // Render step 1: Contractor Info
  const renderStep1 = () => (
    <div className="bg-halo-dark-light border border-halo-dark-light rounded-lg p-8">
      <div className="mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-halo-ice text-black flex items-center justify-center font-bold">
              1
            </div>
            <div className="w-20 h-1 bg-halo-dark"></div>
            <div className="w-8 h-8 rounded-full bg-halo-dark text-halo-medium flex items-center justify-center">
              2
            </div>
            <div className="w-20 h-1 bg-halo-dark"></div>
            <div className="w-8 h-8 rounded-full bg-halo-dark text-halo-medium flex items-center justify-center">
              3
            </div>
          </div>
        </div>
        <p className="text-center text-halo-medium text-sm">
          Step 1 of 3: Your Information
        </p>
      </div>

      <form onSubmit={handleStep1Submit} className="space-y-6">
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-halo-light mb-2"
          >
            Your Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={contractorInfo.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-4 py-3 bg-black border ${
              errors.name ? 'border-red-500' : 'border-halo-dark'
            } rounded-lg text-white placeholder-halo-medium focus:outline-none focus:ring-2 focus:ring-halo-ice focus:border-transparent`}
            placeholder="John Smith"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-400">{errors.name}</p>
          )}
        </div>

        {/* Company */}
        <div>
          <label
            htmlFor="company"
            className="block text-sm font-medium text-halo-light mb-2"
          >
            Company Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="company"
            value={contractorInfo.company}
            onChange={(e) => handleInputChange('company', e.target.value)}
            className={`w-full px-4 py-3 bg-black border ${
              errors.company ? 'border-red-500' : 'border-halo-dark'
            } rounded-lg text-white placeholder-halo-medium focus:outline-none focus:ring-2 focus:ring-halo-ice focus:border-transparent`}
            placeholder="Smith Roofing & Repair"
          />
          {errors.company && (
            <p className="mt-1 text-sm text-red-400">{errors.company}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-halo-light mb-2"
          >
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={contractorInfo.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-4 py-3 bg-black border ${
              errors.email ? 'border-red-500' : 'border-halo-dark'
            } rounded-lg text-white placeholder-halo-medium focus:outline-none focus:ring-2 focus:ring-halo-ice focus:border-transparent`}
            placeholder="john@smithroofing.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-400">{errors.email}</p>
          )}
          <p className="mt-1 text-sm text-halo-medium">
            Lead notifications will be sent here
          </p>
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-halo-light mb-2"
          >
            Phone <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            value={contractorInfo.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`w-full px-4 py-3 bg-black border ${
              errors.phone ? 'border-red-500' : 'border-halo-dark'
            } rounded-lg text-white placeholder-halo-medium focus:outline-none focus:ring-2 focus:ring-halo-ice focus:border-transparent`}
            placeholder="(214) 555-0123"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
          )}
        </div>

        {/* Neighborhood Name */}
        <div>
          <label
            htmlFor="neighborhood"
            className="block text-sm font-medium text-halo-light mb-2"
          >
            Neighborhood/Area Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="neighborhood"
            value={contractorInfo.neighborhoodName}
            onChange={(e) =>
              handleInputChange('neighborhoodName', e.target.value)
            }
            className={`w-full px-4 py-3 bg-black border ${
              errors.neighborhoodName ? 'border-red-500' : 'border-halo-dark'
            } rounded-lg text-white placeholder-halo-medium focus:outline-none focus:ring-2 focus:ring-halo-ice focus:border-transparent`}
            placeholder="e.g., Oak Ridge Subdivision, Dallas TX"
          />
          {errors.neighborhoodName && (
            <p className="mt-1 text-sm text-red-400">
              {errors.neighborhoodName}
            </p>
          )}
          <p className="mt-1 text-sm text-halo-medium">
            Be specific - this helps homeowners know it's their area
          </p>
        </div>

        {/* Error message */}
        {errors.submit && (
          <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-400">{errors.submit}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-4 bg-halo-ice text-black font-semibold rounded-lg hover:bg-halo-ice/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating Campaign...' : 'Continue to Photo Upload'}
        </button>
      </form>
    </div>
  );

  // Render step 2: Photo Upload
  const renderStep2 = () => (
    <div className="bg-halo-dark-light border border-halo-dark-light rounded-lg p-8">
      <div className="mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
              ✓
            </div>
            <div className="w-20 h-1 bg-halo-ice"></div>
            <div className="w-8 h-8 rounded-full bg-halo-ice text-black flex items-center justify-center font-bold">
              2
            </div>
            <div className="w-20 h-1 bg-halo-dark"></div>
            <div className="w-8 h-8 rounded-full bg-halo-dark text-halo-medium flex items-center justify-center">
              3
            </div>
          </div>
        </div>
        <p className="text-center text-halo-medium text-sm">
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
    <div className="bg-halo-dark-light border border-halo-dark-light rounded-lg p-8 text-center">
      <div className="mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
              ✓
            </div>
            <div className="w-20 h-1 bg-halo-ice"></div>
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
              ✓
            </div>
            <div className="w-20 h-1 bg-halo-ice"></div>
            <div className="w-8 h-8 rounded-full bg-halo-ice text-black flex items-center justify-center font-bold">
              3
            </div>
          </div>
        </div>
        <p className="text-center text-halo-medium text-sm">
          Step 3 of 3: Generating QR Code
        </p>
      </div>

      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-halo-ice mx-auto mb-4"></div>
      <h3 className="text-2xl font-bold text-white mb-2">
        Creating Your Campaign...
      </h3>
      <p className="text-halo-medium">
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
