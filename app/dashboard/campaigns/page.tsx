'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface Campaign {
  id: string;
  campaignName: string;
  showcaseAddress?: string;
  jobStatus?: 'Completed' | 'Pending';
  campaignStatus?: 'Active' | 'Inactive';
  status?: 'active' | 'paused' | 'completed'; // Legacy field for backward compatibility
  pageSlug: string;
  createdAt: any;
  leadCount?: number;
}

export default function CampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'leads'>('date');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Active' | 'Inactive'>('all');

  const normalizeStatus = (campaign: Campaign): 'Active' | 'Inactive' => {
    if (campaign.campaignStatus) {
      return campaign.campaignStatus;
    }

    if (campaign.status === 'active') {
      return 'Active';
    }

    return 'Inactive';
  };

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user) return;

      try {
        const campaignsRef = collection(db, 'campaigns');
        const campaignsQuery = query(
          campaignsRef,
          where('contractorId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const campaignsSnapshot = await getDocs(campaignsQuery);

        // Fetch lead counts for each campaign
        const campaignsData = await Promise.all(
          campaignsSnapshot.docs.map(async (doc) => {
            const campaignData = doc.data();

            // Fetch leads count for this campaign
            const leadsRef = collection(db, 'leads');
            const leadsQuery = query(leadsRef, where('campaignId', '==', doc.id));
            const leadsSnapshot = await getDocs(leadsQuery);

            return {
              id: doc.id,
              ...campaignData,
              leadCount: leadsSnapshot.size,
            } as Campaign;
          })
        );

        setCampaigns(campaignsData);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
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
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">My Campaigns</h1>
          <p className="text-gray-400 mt-2">
            Manage your lead generation campaigns
          </p>
        </div>
        <Link
          href="/create-campaign"
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Create Campaign
        </Link>
      </div>

      {/* Filters and Sort */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filter by status */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
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
              <tbody className="divide-y divide-gray-800">
                {sortedCampaigns.map((campaign) => {
                  const status = normalizeStatus(campaign);
                  const address = campaign.showcaseAddress || 'N/A';

                  return (
                    <tr key={campaign.id} className="hover:bg-gray-800/50">
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
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-yellow-900/50 text-yellow-300'
                          }`}
                        >
                          {campaign.jobStatus || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            status === 'Active'
                              ? 'bg-cyan-900/50 text-cyan-300'
                              : 'bg-gray-700 text-gray-300'
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
                          {campaign.createdAt?.toDate().toLocaleDateString()}
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
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
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
