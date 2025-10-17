'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import CampaignMap from '@/components/CampaignMap';

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalLeads: number;
  recentLeads: number;
}

interface RecentLead {
  id: string;
  name: string;
  email: string;
  campaignId: string;
  campaignName: string;
  submittedAt: string;
}

interface RecentCampaign {
  id: string;
  campaignName: string;
  showcaseAddress: string | null;
  jobStatus: 'Completed' | 'Pending' | null;
  campaignStatus: 'Active' | 'Inactive';
  leadCount: number;
  pageSlug: string;
  createdAt: string;
  hasNewLeads: boolean;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalLeads: 0,
    recentLeads: 0,
  });
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!user) {
        setStats({
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalLeads: 0,
          recentLeads: 0,
        });
        setRecentLeads([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/dashboard/summary', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to load dashboard summary');
        }

        const data = await response.json();
        setStats(data.stats);
        setRecentLeads(data.recentLeads);
        setRecentCampaigns(data.recentCampaigns || []);
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load dashboard summary'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cyan-400 text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-500/20 border border-red-400 text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user?.displayName || 'Contractor'}
        </h1>
        <p className="text-gray-300 mt-2">
          Here's an overview of your lead generation campaigns
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Campaigns"
          value={stats.totalCampaigns}
          color="cyan"
        />
        <StatCard
          title="Active Campaigns"
          value={stats.activeCampaigns}
          color="green"
        />
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          color="blue"
        />
        <StatCard
          title="Recent Leads"
          value={stats.recentLeads}
          color="purple"
        />
      </div>

      {/* Campaign Map */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Campaign Locations</h2>
        <CampaignMap />
      </div>

      {/* Recent Leads & Campaigns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Leads</h2>
          {recentLeads.length > 0 ? (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0"
                >
                  <div>
                    <p className="text-white font-medium">{lead.name}</p>
                    <p className="text-gray-300 text-sm">{lead.email}</p>
                    <p className="text-gray-400 text-xs">{lead.campaignName}</p>
                  </div>
                  <span className="text-gray-400 text-xs">
                    {new Date(lead.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              <Link
                href="/dashboard/campaigns"
                className="block text-center text-cyan-400 hover:text-cyan-300 text-sm font-medium mt-4"
              >
                View All Campaigns →
              </Link>
            </div>
          ) : (
            <p className="text-gray-300 text-center py-8">No leads yet</p>
          )}
        </div>

        {/* Recent Campaigns */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Campaigns</h2>
          {recentCampaigns.length > 0 ? (
            <div className="space-y-3">
              {recentCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/dashboard/campaigns/${campaign.id}`}
                  className="block py-3 border-b border-slate-700 last:border-0 hover:bg-slate-700/30 -mx-2 px-2 rounded transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium truncate">{campaign.campaignName}</p>
                        {campaign.hasNewLeads && (
                          <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-cyan-500/20 text-cyan-400">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                            New
                          </span>
                        )}
                      </div>
                      {campaign.showcaseAddress && (
                        <p className="text-gray-400 text-xs mt-1 truncate">{campaign.showcaseAddress}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            campaign.campaignStatus === 'Active'
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {campaign.campaignStatus}
                        </span>
                        {campaign.jobStatus && (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              campaign.jobStatus === 'Completed'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-orange-500/20 text-orange-400'
                            }`}
                          >
                            {campaign.jobStatus}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right ml-3">
                      <p className="text-white font-bold">{campaign.leadCount}</p>
                      <p className="text-gray-400 text-xs">leads</p>
                    </div>
                  </div>
                </Link>
              ))}
              <Link
                href="/dashboard/campaigns"
                className="block text-center text-cyan-400 hover:text-cyan-300 text-sm font-medium mt-4"
              >
                View All Campaigns →
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-300 mb-4">No campaigns yet</p>
              <Link
                href="/create-campaign"
                className="inline-block bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Create Your First Campaign
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  color: 'cyan' | 'green' | 'blue' | 'purple';
}

function StatCard({ title, value, color }: StatCardProps) {
  const colorClasses = {
    cyan: 'text-cyan-400',
    green: 'text-green-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow-lg">
      <p className="text-gray-300 text-sm font-medium mb-2">{title}</p>
      <p className={`text-4xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}
