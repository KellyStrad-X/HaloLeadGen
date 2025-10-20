'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import LeadDetailsModal from './LeadDetailsModal';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  notes: string | null;
  submittedAt: string;
  jobStatus: 'new' | 'contacted' | 'scheduled' | 'completed';
  campaignId: string;
  campaignName: string;
}

interface Campaign {
  id: string;
  campaignName: string;
}

const JOB_STATUS_LABELS: Record<Lead['jobStatus'], string> = {
  new: 'New',
  contacted: 'Contacted',
  scheduled: 'Scheduled',
  completed: 'Completed',
};

const JOB_STATUS_CLASSES: Record<Lead['jobStatus'], string> = {
  new: 'bg-[#2d333b] text-gray-300',
  contacted: 'bg-blue-900/50 text-blue-300',
  scheduled: 'bg-orange-900/50 text-orange-300',
  completed: 'bg-green-900/50 text-green-300',
};

export default function LeadsTab() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCampaign, setFilterCampaign] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLeads([]);
        setCampaigns([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await user.getIdToken();

        // Fetch leads
        const params = new URLSearchParams();
        if (filterCampaign !== 'all') params.append('campaignId', filterCampaign);
        if (filterStatus !== 'all') params.append('jobStatus', filterStatus);

        const leadsResponse = await fetch(`/api/dashboard/leads?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!leadsResponse.ok) {
          const payload = await leadsResponse.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to load leads');
        }

        const leadsData = await leadsResponse.json();
        setLeads(leadsData.leads);

        // Fetch campaigns for filter dropdown (only once on mount)
        if (campaigns.length === 0) {
          const campaignsResponse = await fetch('/api/dashboard/campaigns', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (campaignsResponse.ok) {
            const campaignsData = await campaignsResponse.json();
            setCampaigns(campaignsData.campaigns);
          }
        }
      } catch (error) {
        console.error('Error fetching leads:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to load leads'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, filterCampaign, filterStatus]);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    setSelectedCampaignId(lead.campaignId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLeadId(null);
    setSelectedCampaignId(null);
  };

  const handleLeadUpdated = async () => {
    // Refresh the leads list after an update
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (filterCampaign !== 'all') params.append('campaignId', filterCampaign);
      if (filterStatus !== 'all') params.append('jobStatus', filterStatus);

      const response = await fetch(`/api/dashboard/leads?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
      }
    } catch (err) {
      console.error('Error refreshing leads:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cyan-400 text-xl">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/40 border border-red-600 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#1e2227]/60 border border-[#373e47] rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filter by campaign */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filter by Campaign
            </label>
            <select
              value={filterCampaign}
              onChange={(e) => setFilterCampaign(e.target.value)}
              className="w-full px-4 py-2 bg-[#0d1117] border border-[#373e47] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.campaignName}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by status */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-[#0d1117] border border-[#373e47] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      {leads.length > 0 ? (
        <div className="bg-[#1e2227]/60 border border-[#373e47] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0d1117]/80 border-b border-[#373e47]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#373e47]">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => handleLeadClick(lead)}
                    className="hover:bg-[#2d333b]/30 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {lead.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">{lead.campaignName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">{lead.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${JOB_STATUS_CLASSES[lead.jobStatus]}`}
                      >
                        {JOB_STATUS_LABELS[lead.jobStatus]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">
                        {new Date(lead.submittedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                      <div className="flex space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeadClick(lead);
                          }}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          View
                        </button>
                        <a
                          href={`tel:${lead.phone}`}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          Call
                        </a>
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          Email
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#1e2227]/60 border border-[#373e47] rounded-lg p-12 text-center">
          <p className="text-gray-400 text-lg mb-4">
            {filterCampaign !== 'all' || filterStatus !== 'all'
              ? 'No leads match your filters'
              : 'No leads yet'}
          </p>
          <p className="text-gray-500 text-sm">
            Leads will appear here once customers submit your QR landing page forms.
          </p>
        </div>
      )}

      {/* Lead Details Modal */}
      {selectedLeadId && selectedCampaignId && (
        <LeadDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          leadId={selectedLeadId}
          campaignId={selectedCampaignId}
          onLeadUpdated={handleLeadUpdated}
        />
      )}
    </div>
  );
}
