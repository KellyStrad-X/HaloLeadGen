'use client';

import { useState, FormEvent } from 'react';

interface LeadFormProps {
  campaignId: number;
}

interface FormData {
  name: string;
  address: string;
  email: string;
  phone: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export default function LeadForm({ campaignId }: LeadFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    email: '',
    phone: '',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Please enter your complete address';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setSubmitMessage(data.message || 'Thank you! We\'ll contact you within 24 hours.');
        // Reset form
        setFormData({
          name: '',
          address: '',
          email: '',
          phone: '',
          notes: '',
        });
      } else {
        setSubmitStatus('error');
        setSubmitMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="bg-halo-dark border border-halo-ice/30 rounded-lg p-8 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-halo-ice/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-halo-ice"
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
          </div>
          <h4 className="text-2xl font-bold text-white mb-2">Request Received!</h4>
          <p className="text-halo-light">{submitMessage}</p>
        </div>
        <button
          onClick={() => setSubmitStatus('idle')}
          className="text-halo-ice hover:text-white transition-colors text-sm"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-halo-dark border border-halo-medium/30 rounded-lg p-6 sm:p-8">
      {submitStatus === 'error' && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">{submitMessage}</p>
        </div>
      )}

      <div className="space-y-5">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-halo-light mb-2">
            Full Name <span className="text-halo-ice">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`w-full px-4 py-3 bg-halo-dark-light border ${
              errors.name ? 'border-red-500' : 'border-halo-medium/30'
            } rounded-lg text-white placeholder-halo-medium focus:outline-none focus:border-halo-ice transition-colors`}
            placeholder="John Smith"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-400">{errors.name}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-halo-light mb-2">
            Home Address <span className="text-halo-ice">*</span>
          </label>
          <input
            type="text"
            id="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className={`w-full px-4 py-3 bg-halo-dark-light border ${
              errors.address ? 'border-red-500' : 'border-halo-medium/30'
            } rounded-lg text-white placeholder-halo-medium focus:outline-none focus:border-halo-ice transition-colors`}
            placeholder="123 Oak Street, Dallas TX 75001"
            disabled={isSubmitting}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-400">{errors.address}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-halo-light mb-2">
            Email Address <span className="text-halo-ice">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full px-4 py-3 bg-halo-dark-light border ${
              errors.email ? 'border-red-500' : 'border-halo-medium/30'
            } rounded-lg text-white placeholder-halo-medium focus:outline-none focus:border-halo-ice transition-colors`}
            placeholder="john@example.com"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-400">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-halo-light mb-2">
            Phone Number <span className="text-halo-ice">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className={`w-full px-4 py-3 bg-halo-dark-light border ${
              errors.phone ? 'border-red-500' : 'border-halo-medium/30'
            } rounded-lg text-white placeholder-halo-medium focus:outline-none focus:border-halo-ice transition-colors`}
            placeholder="(214) 555-1234"
            disabled={isSubmitting}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-halo-light mb-2">
            Additional Notes <span className="text-halo-medium text-xs">(Optional)</span>
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-halo-dark-light border border-halo-medium/30 rounded-lg text-white placeholder-halo-medium focus:outline-none focus:border-halo-ice transition-colors resize-none"
            placeholder="Tell us about any specific concerns or questions..."
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-halo-ice hover:bg-halo-ice/90 disabled:bg-halo-medium disabled:cursor-not-allowed text-black font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Submitting...
            </span>
          ) : (
            'Request Free Inspection'
          )}
        </button>

        <p className="text-center text-xs text-halo-medium mt-4">
          By submitting, you agree to be contacted about roofing services. No spam, ever.
        </p>
      </div>
    </form>
  );
}
