'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface Campaign {
  id: string;
  campaignName: string;
  showcaseAddress: string | null;
  jobStatus: 'Completed' | 'Pending' | null;
  campaignStatus: 'Active' | 'Inactive';
  pageSlug: string;
  createdAt: string;
  leadCount: number;
}

export default function CampaignsTab() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'leads'>('date');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [error, setError] = useState<string | null>(null);

  const normalizeStatus = (campaign: Campaign): 'Active' | 'Inactive' =>
    campaign.campaignStatus;

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user) {
        setCampaigns([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/dashboard/campaigns', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to load campaigns');
        }

        const data = await response.json();
        setCampaigns(data.campaigns);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to load campaigns'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user]);

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((campaign) => {
    if (filterStatus === 'all') return true;
    return normalizeStatus(campaign) === filterStatus;
  });

  // Sort campaigns
  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.campaignName.localeCompare(b.campaignName);
      case 'leads':
        return (b.leadCount || 0) - (a.leadCount || 0);
      case 'date':
      default:
        const aTime = new Date(a.createdAt || '').getTime();
        const bTime = new Date(b.createdAt || '').getTime();
        return bTime - aTime;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cyan-400 text-xl">Loading campaigns...</div>
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

      {/* Filters and Sort */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filter by status */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Campaigns</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Sort by */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="date">Date Created</option>
              <option value="name">Campaign Name</option>
              <option value="leads">Lead Count</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      {sortedCampaigns.length > 0 ? (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/80 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Campaign Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Job Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Campaign Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {sortedCampaigns.map((campaign) => {
                  const status = normalizeStatus(campaign);
                  const address = campaign.showcaseAddress || 'N/A';

                  return (
                    <tr key={campaign.id} className="hover:bg-slate-700/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {campaign.campaignName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">{address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            campaign.jobStatus === 'Completed'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-orange-500/20 text-orange-400'
                          }`}
                        >
                          {campaign.jobStatus || 'N/A'}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          status === 'Active'
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-cyan-400">
                          {campaign.leadCount || 0}
                        </div>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">
                        {campaign.createdAt
                          ? new Date(campaign.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <Link
                            href={`/dashboard/campaigns/${campaign.id}`}
                            className="text-cyan-400 hover:text-cyan-300"
                          >
                            Details
                          </Link>
                          <span className="text-gray-600">|</span>
                          <a
                            href={`/c/${campaign.pageSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-300"
                          >
                            View Page
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-12 text-center">
          <p className="text-gray-400 text-lg mb-4">
            {filterStatus === 'all'
              ? 'No campaigns yet'
              : `No ${filterStatus.toLowerCase()} campaigns`}
          </p>
          <Link
            href="/create-campaign"
            className="inline-block bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Create Your First Campaign
          </Link>
        </div>
      )}
    </div>
  );
}
