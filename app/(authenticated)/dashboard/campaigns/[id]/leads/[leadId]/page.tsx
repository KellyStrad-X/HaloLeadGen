'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  notes: string | null;
  submittedAt: string;
  jobStatus?: 'new' | 'contacted' | 'scheduled' | 'completed';
  jobStatusUpdatedAt?: string;
  mapConsent?: boolean;
  contractorNotes?: string;
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const leadId = params.leadId as string;
  const { user } = useAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [jobStatus, setJobStatus] = useState<Lead['jobStatus']>('new');
  const [contractorNotes, setContractorNotes] = useState('');

  useEffect(() => {
    const fetchLead = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/leads/${leadId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load lead details');
        }

        const data = await response.json();
        setLead(data.lead);
        setJobStatus(data.lead.jobStatus || 'new');
        setContractorNotes(data.lead.contractorNotes || '');
      } catch (err) {
        console.error('Error fetching lead:', err);
        setError(err instanceof Error ? err.message : 'Failed to load lead');
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [leadId, user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobStatus,
          contractorNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update lead');
      }

      const data = await response.json();
      setLead(data.lead);
      setSuccessMessage('Lead updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating lead:', err);
      setError(err instanceof Error ? err.message : 'Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cyan-400 text-xl">Loading lead details...</div>
      </div>
    );
  }

  if (error && !lead) {
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

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg mb-4">Lead not found</p>
        <Link
          href={`/dashboard/campaigns/${campaignId}`}
          className="text-cyan-400 hover:text-cyan-300"
        >
          ← Back to Campaign
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
        <h1 className="text-3xl font-bold text-white">{lead.name}</h1>
        <p className="text-gray-400 mt-1">
          Submitted {new Date(lead.submittedAt).toLocaleDateString()} at{' '}
          {new Date(lead.submittedAt).toLocaleTimeString()}
        </p>
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

      {/* Contact Information */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Email
            </label>
            <div className="flex items-center gap-2">
              <a
                href={`mailto:${lead.email}`}
                className="text-cyan-400 hover:text-cyan-300 flex-1"
              >
                {lead.email}
              </a>
              <a
                href={`mailto:${lead.email}`}
                className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded transition-colors text-sm"
              >
                Email
              </a>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Phone
            </label>
            <div className="flex items-center gap-2">
              <a
                href={`tel:${lead.phone}`}
                className="text-cyan-400 hover:text-cyan-300 flex-1"
              >
                {lead.phone}
              </a>
              <a
                href={`tel:${lead.phone}`}
                className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded transition-colors text-sm"
              >
                Call
              </a>
            </div>
          </div>

          {lead.address && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Address
              </label>
              <div className="flex items-center gap-2">
                <p className="text-white flex-1">{lead.address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded transition-colors text-sm"
                >
                  Map
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Job Status & Management */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Job Status</h2>

        {/* Map Consent Indicator */}
        {lead.mapConsent !== undefined && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              {lead.mapConsent ? (
                <>
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-400 font-medium">Opted into Halo Map</span>
                  <span className="text-gray-400 text-sm ml-2">
                    - This lead will appear on the campaign map when job is completed
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-gray-400">Not opted into Halo Map</span>
                </>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="jobStatus" className="block text-sm font-medium text-gray-300 mb-2">
              Current Status
            </label>
            <select
              id="jobStatus"
              value={jobStatus}
              onChange={(e) => setJobStatus(e.target.value as Lead['jobStatus'])}
              className="w-full md:w-1/2 bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="new">New - Not Yet Contacted</option>
              <option value="contacted">Contacted - Initial outreach made</option>
              <option value="scheduled">Scheduled - Job scheduled or in progress</option>
              <option value="completed">Completed - Job finished</option>
            </select>
            {lead.jobStatusUpdatedAt && (
              <p className="text-gray-400 text-sm mt-2">
                Last updated: {new Date(lead.jobStatusUpdatedAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="p-4 bg-gray-800/50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Status Guide:</h3>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>
                <span className="text-yellow-400">● New:</span> Lead just submitted, needs follow-up
              </li>
              <li>
                <span className="text-blue-400">● Contacted:</span> You've reached out to the lead
              </li>
              <li>
                <span className="text-orange-400">● Scheduled:</span> Job is on the calendar (shows as orange marker on Halo Map)
              </li>
              <li>
                <span className="text-green-400">● Completed:</span> Job is done (shows as green marker on Halo Map)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Lead Notes */}
      {lead.notes && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Lead's Message</h2>
          <p className="text-gray-300 whitespace-pre-wrap">{lead.notes}</p>
        </div>
      )}

      {/* Contractor Notes */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Your Notes</h2>
        <textarea
          value={contractorNotes}
          onChange={(e) => setContractorNotes(e.target.value)}
          rows={6}
          placeholder="Add your notes about this lead, follow-up reminders, job details, etc..."
          className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Link
          href={`/dashboard/campaigns/${campaignId}`}
          className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
