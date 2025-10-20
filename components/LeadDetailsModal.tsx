'use client';

import { useEffect, useState } from 'react';
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
  contractorNotes?: string;
  campaignName?: string;
}

interface LeadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  campaignId?: string;
  onLeadUpdated?: () => void;
}

export default function LeadDetailsModal({
  isOpen,
  onClose,
  leadId,
  campaignId,
  onLeadUpdated,
}: LeadDetailsModalProps) {
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
      if (!isOpen || !user) return;

      setLoading(true);
      setError(null);

      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/leads/${leadId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 404) {
          throw new Error('Lead not found');
        }

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to load lead details');
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
  }, [isOpen, leadId, user]);

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

      // Notify parent component
      if (onLeadUpdated) {
        onLeadUpdated();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating lead:', err);
      setError(err instanceof Error ? err.message : 'Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/75"
        aria-hidden="true"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative z-10 w-full max-w-4xl overflow-hidden rounded-lg bg-[#24292e] text-left shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-cyan-400 text-xl">Loading lead details...</div>
            </div>
          ) : error && !lead ? (
            <div className="p-6 text-center">
              <p className="text-red-400 text-lg mb-4">{error}</p>
              <button
                onClick={onClose}
                className="text-cyan-400 hover:text-cyan-300"
              >
                Close
              </button>
            </div>
          ) : !lead ? (
            <div className="p-6 text-center">
              <p className="text-gray-400 text-lg mb-4">Lead not found</p>
              <button
                onClick={onClose}
                className="text-cyan-400 hover:text-cyan-300"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-[#1e2227] border-b border-[#373e47] px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{lead.name}</h2>
                    {lead.campaignName && (
                      <p className="text-gray-400 text-sm mt-1">
                        Campaign: {lead.campaignName}
                      </p>
                    )}
                    <p className="text-gray-400 text-sm mt-1">
                      Submitted {new Date(lead.submittedAt).toLocaleDateString()} at{' '}
                      {new Date(lead.submittedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Close lead details"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 max-h-[70vh] overflow-y-auto space-y-6">
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
                <div className="bg-[#2d333b] border border-[#373e47] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Email
                      </label>
                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-cyan-400 hover:text-cyan-300 flex-1 break-all"
                        >
                          {lead.email}
                        </a>
                        <a
                          href={`mailto:${lead.email}`}
                          className="bg-[#1e2227] hover:bg-[#373e47] text-white px-3 py-2 rounded transition-colors text-sm whitespace-nowrap"
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
                          className="bg-[#1e2227] hover:bg-[#373e47] text-white px-3 py-2 rounded transition-colors text-sm whitespace-nowrap"
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
                            className="bg-[#1e2227] hover:bg-[#373e47] text-white px-3 py-2 rounded transition-colors text-sm whitespace-nowrap"
                          >
                            Map
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Job Status & Management */}
                <div className="bg-[#2d333b] border border-[#373e47] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Job Status</h3>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="jobStatus" className="block text-sm font-medium text-gray-300 mb-2">
                        Current Status
                      </label>
                      <select
                        id="jobStatus"
                        value={jobStatus}
                        onChange={(e) => setJobStatus(e.target.value as Lead['jobStatus'])}
                        className="w-full md:w-2/3 bg-[#1e2227] border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
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

                    <div className="p-4 bg-[#1e2227]/50 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Status Guide:</h4>
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
                  <div className="bg-[#2d333b] border border-[#373e47] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Lead's Message</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                )}

                {/* Contractor Notes */}
                <div className="bg-[#2d333b] border border-[#373e47] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Your Notes</h3>
                  <textarea
                    value={contractorNotes}
                    onChange={(e) => setContractorNotes(e.target.value)}
                    rows={6}
                    placeholder="Add your notes about this lead, follow-up reminders, job details, etc..."
                    className="w-full bg-[#1e2227] border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="bg-[#1e2227] border-t border-[#373e47] px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="bg-[#2d333b] hover:bg-[#373e47] text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
