'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

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

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalLeads: 0,
    recentLeads: 0,
  });
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
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
        <div className="bg-red-900/40 border border-red-600 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user?.displayName || 'Contractor'}
        </h1>
        <p className="text-gray-400 mt-2">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Leads</h2>
          {recentLeads.length > 0 ? (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0"
                >
                  <div>
                    <p className="text-white font-medium">{lead.name}</p>
                    <p className="text-gray-400 text-sm">{lead.email}</p>
                    <p className="text-gray-500 text-xs">{lead.campaignName}</p>
                  </div>
                  <span className="text-gray-500 text-xs">
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
            <p className="text-gray-400 text-center py-8">No leads yet</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/create-campaign"
              className="block w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-3 px-4 rounded-lg text-center transition-colors"
            >
              Create New Campaign
            </Link>
            <Link
              href="/dashboard/campaigns"
              className="block w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors"
            >
              View All Campaigns
            </Link>
          </div>
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
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <p className="text-gray-400 text-sm font-medium mb-2">{title}</p>
      <p className={`text-4xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}
