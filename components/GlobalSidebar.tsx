'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useDashboardSidebar } from '@/lib/dashboard-sidebar-context';
import JobModal, { type LeadJobStatus } from './JobModal';
import RestoreModal from './RestoreModal';
import CampaignDetailsModal from './CampaignDetailsModal';

type LegacyLeadStatus = 'new' | 'contacted' | 'scheduled' | 'completed';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  notes: string | null;
  submittedAt: string;
  jobStatus: LegacyLeadStatus;
  campaignId: string;
  campaignName: string;
  contactAttempt?: number;
  isColdLead?: boolean;
  tentativeDate?: string | null;
  inspector?: string | null; // Can be assigned at any stage
  internalNotes?: string | null;
}

interface Job {
  id: string;
  campaignId: string;
  campaignName: string;
  customerName: string;
  email: string;
  phone: string;
  address: string | null;
  notes: string | null;
  status: string;
  scheduledInspectionDate: string | null;
  inspector: string | null;
  internalNotes: string | null;
  promotedAt: string;
  completedAt: string | null;
}

interface DashboardCampaign {
  id: string;
  campaignName: string;
  campaignStatus: 'Active' | 'Inactive';
  leadCount: number;
}

interface CampaignSummary {
  id: string;
  name: string;
  leadCount: number;
  activeCampaignCount?: number; // Only for 'all' option
  campaignStatus?: 'Active' | 'Inactive';
}

const getLeadBadge = (lead: Lead): { label: string; className: string } => {
  if (lead.isColdLead) {
    return {
      label: '❄️',
      className: 'bg-gray-500/20 text-gray-400 ring-1 ring-gray-500/40',
    };
  }

  const attempt = lead.contactAttempt ?? 0;
  switch (attempt) {
    case 0:
      return {
        label: 'UNSCHEDULED',
        className: 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40',
      };
    case 1:
      return {
        label: '1ST ATTEMPT',
        className: 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/40',
      };
    case 2:
      return {
        label: '2ND ATTEMPT',
        className: 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40',
      };
    case 3:
      return {
        label: '3RD ATTEMPT',
        className: 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40',
      };
    default:
      return {
        label: 'UNSCHEDULED',
        className: 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40',
      };
  }
};

export default function GlobalSidebar() {
  const { user } = useAuth();
  const {
    selectedCampaignId,
    setSelectedCampaignId,
    isSidebarCollapsed,
    toggleSidebar,
    registerSidebarRefresh,
    refreshSidebar,
    setDraggingItem,
    campaignDetailsModal,
    openCampaignDetails,
    closeCampaignDetails,
  } = useDashboardSidebar();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobs, setJobs] = useState<{ scheduled: Job[]; completed: Job[] }>({
    scheduled: [],
    completed: [],
  });
  const [allCampaigns, setAllCampaigns] = useState<DashboardCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadSortOrder, setLeadSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [leadsPage, setLeadsPage] = useState(0);
  const [activeBucket, setActiveBucket] = useState<'leads' | 'cold' | 'completed'>('leads');
  const [leadModalState, setLeadModalState] = useState<{
    lead: Lead | null;
    isOpen: boolean;
  }>({ lead: null, isOpen: false });
  const [restoreModalState, setRestoreModalState] = useState<{
    lead: Lead | null;
    isOpen: boolean;
  }>({ lead: null, isOpen: false });
  const [restoreJobModalState, setRestoreJobModalState] = useState<{
    job: Job | null;
    isOpen: boolean;
  }>({ job: null, isOpen: false });

  // Data fetching
  const loadData = useCallback(async () => {
    if (!user) {
      setLeads([]);
      setJobs({ scheduled: [], completed: [] });
      setAllCampaigns([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const [leadsResponse, jobsResponse, campaignsResponse] = await Promise.all([
        fetch('/api/dashboard/leads', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/dashboard/jobs', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/dashboard/campaigns', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!leadsResponse.ok || !jobsResponse.ok || !campaignsResponse.ok) {
        throw new Error('Failed to load data');
      }

      const leadsData = await leadsResponse.json();
      const jobsData = await jobsResponse.json();
      const campaignsData = await campaignsResponse.json();

      setLeads(leadsData.leads ?? []);
      setJobs({
        scheduled: jobsData.jobs?.scheduled ?? [],
        completed: jobsData.jobs?.completed ?? [],
      });
      setAllCampaigns(campaignsData.campaigns ?? []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Register refresh callback with context
  useEffect(() => {
    const unregister = registerSidebarRefresh(loadData);
    return () => unregister();
  }, [registerSidebarRefresh, loadData]);

  // Campaign summaries logic
  const campaignSummaries = useMemo<CampaignSummary[]>(() => {
    const map = new Map<string, CampaignSummary>();

    allCampaigns.forEach((campaign) => {
      map.set(campaign.id, {
        id: campaign.id,
        name: campaign.campaignName,
        leadCount: 0,
        campaignStatus: campaign.campaignStatus,
      });
    });

    // Count non-cold leads for each campaign
    leads.forEach((lead) => {
      if (lead.isColdLead) return; // Skip cold leads

      if (!map.has(lead.campaignId)) {
        map.set(lead.campaignId, {
          id: lead.campaignId,
          name: lead.campaignName,
          leadCount: 0,
        });
      }
      const entry = map.get(lead.campaignId)!;
      entry.leadCount += 1;
    });

    // Count scheduled jobs for each campaign
    jobs.scheduled.forEach((job) => {
      if (!map.has(job.campaignId)) {
        map.set(job.campaignId, {
          id: job.campaignId,
          name: job.campaignName,
          leadCount: 0,
        });
      }
      const entry = map.get(job.campaignId)!;
      entry.leadCount += 1;
    });

    const result = Array.from(map.values());
    result.sort((a, b) => {
      if (a.campaignStatus !== b.campaignStatus) {
        if (a.campaignStatus === 'Active') return -1;
        if (b.campaignStatus === 'Active') return 1;
      }
      if (a.leadCount !== b.leadCount) {
        return b.leadCount - a.leadCount;
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [leads, jobs, allCampaigns]);

  const campaignOptions = useMemo(() => {
    // Count active campaigns
    const activeCampaignCount = allCampaigns.filter(
      (c) => c.campaignStatus === 'Active'
    ).length;

    // Count total leads (non-cold leads + scheduled jobs)
    const totalLeadCount =
      leads.filter((l) => !l.isColdLead).length + jobs.scheduled.length;

    return [
      {
        id: 'all',
        name: 'All Campaigns',
        leadCount: totalLeadCount,
        activeCampaignCount: activeCampaignCount,
      },
      ...campaignSummaries,
    ];
  }, [campaignSummaries, leads, jobs, allCampaigns]);

  // Lead filtering
  const filteredLeads = useMemo(() => {
    const activeLeads = leads.filter((lead) => !lead.isColdLead && !lead.tentativeDate);
    if (selectedCampaignId === 'all') return activeLeads;
    return activeLeads.filter((lead) => lead.campaignId === selectedCampaignId);
  }, [leads, selectedCampaignId]);

  const coldLeads = useMemo(() => {
    const cold = leads.filter((lead) => lead.isColdLead);
    if (selectedCampaignId === 'all') return cold;
    return cold.filter((lead) => lead.campaignId === selectedCampaignId);
  }, [leads, selectedCampaignId]);

  const filteredJobs = useMemo(() => {
    if (selectedCampaignId === 'all') return jobs;
    return {
      scheduled: jobs.scheduled.filter((job) => job.campaignId === selectedCampaignId),
      completed: jobs.completed.filter((job) => job.campaignId === selectedCampaignId),
    };
  }, [jobs, selectedCampaignId]);

  const sortedLeads = useMemo(() => {
    const sorted = [...filteredLeads];
    sorted.sort((a, b) => {
      const dateA = new Date(a.submittedAt).getTime();
      const dateB = new Date(b.submittedAt).getTime();
      return leadSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return sorted;
  }, [filteredLeads, leadSortOrder]);

  const LEADS_PER_PAGE = 8;
  const totalLeadPages = Math.ceil(sortedLeads.length / LEADS_PER_PAGE);
  const paginatedLeads = useMemo(() => {
    const start = leadsPage * LEADS_PER_PAGE;
    return sortedLeads.slice(start, start + LEADS_PER_PAGE);
  }, [sortedLeads, leadsPage]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setLeadsPage(0);
  }, [selectedCampaignId, leadSortOrder, activeBucket]);

  // Clamp page when total pages changes
  useEffect(() => {
    if (totalLeadPages === 0) {
      setLeadsPage(0);
    } else if (leadsPage >= totalLeadPages) {
      setLeadsPage(Math.max(0, totalLeadPages - 1));
    }
  }, [totalLeadPages, leadsPage]);

  const renderLeadCard = (lead: Lead) => {
    const badge = getLeadBadge(lead);
    return (
      <div
        key={lead.id}
        draggable
        onDragStart={(event) => {
          setDraggingItem({ type: 'lead', id: lead.id });
          event.dataTransfer.setData('application/halo-lead', lead.id);
          event.dataTransfer.effectAllowed = 'move';

          const target = event.currentTarget as HTMLElement;
          const clone = target.cloneNode(true) as HTMLElement;
          clone.style.position = 'absolute';
          clone.style.top = '-9999px';
          clone.style.left = '-9999px';
          clone.style.opacity = '0.8';
          clone.style.width = target.offsetWidth + 'px';
          clone.style.pointerEvents = 'none';
          document.body.appendChild(clone);
          event.dataTransfer.setDragImage(clone, 0, 0);
          requestAnimationFrame(() => {
            setTimeout(() => {
              if (clone.parentNode) {
                document.body.removeChild(clone);
              }
            }, 50);
          });
        }}
        onDragEnd={() => {
          setTimeout(() => setDraggingItem(null), 150);
        }}
        onClick={() => {
          if (lead.isColdLead) {
            setRestoreModalState({
              lead: lead,
              isOpen: true,
            });
          } else {
            setLeadModalState({
              lead: lead,
              isOpen: true,
            });
          }
        }}
        className="rounded-lg border border-[#373e47] bg-[#1e2227] p-3 shadow-sm transition ring-cyan-500/40 hover:ring-2 cursor-pointer"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{lead.name}</p>
            <p className="text-xs text-gray-400 truncate">{lead.campaignName}</p>
          </div>
          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold flex-shrink-0 ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <div className="mt-2 space-y-1 text-xs text-gray-400">
          <div className="flex items-center gap-2 truncate">
            <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{lead.email}</span>
          </div>
          <div className="flex items-center gap-2 truncate">
            <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="truncate">{lead.phone}</span>
          </div>
        </div>
        {lead.inspector && (
          <div className="mt-2 flex justify-end">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-300">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {lead.inspector}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderJobCard = (job: Job, isCompleted = false) => (
    <div
      key={job.id}
      onClick={() => {
        if (isCompleted) {
          setRestoreJobModalState({
            job: job,
            isOpen: true,
          });
        }
      }}
      className="rounded-lg border border-[#373e47] bg-[#1e2227] p-3 shadow-sm transition ring-blue-500/40 hover:ring-2 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{job.customerName}</p>
          <p className="text-xs text-gray-400 truncate">{job.campaignName}</p>
        </div>
        <span className="rounded-full bg-green-900/50 text-green-300 px-2 py-1 text-[10px] font-semibold uppercase flex-shrink-0">
          {job.status.replace('_', ' ')}
        </span>
      </div>
      <div className="mt-2 space-y-1 text-xs text-gray-400">
        {job.scheduledInspectionDate && (
          <div className="flex items-center gap-2 truncate">
            <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="truncate">
              {new Date(job.scheduledInspectionDate).toLocaleDateString()}
            </span>
          </div>
        )}
        {job.inspector && (
          <div className="flex items-center gap-2 truncate">
            <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20H7a2 2 0 01-2-2 4 4 0 014-4h6a4 4 0 014 4 2 2 0 01-2 2z"
              />
            </svg>
            <span className="truncate">{job.inspector}</span>
          </div>
        )}
        <div className="flex items-center gap-2 truncate">
          <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="truncate">{job.email}</span>
        </div>
        <div className="flex items-center gap-2 truncate">
          <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="truncate">{job.phone}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={`flex-shrink-0 border-r border-[#373e47] bg-[#1e2227] flex flex-col h-[calc(100vh-64px)] overflow-hidden transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-12' : 'w-[400px]'
        }`}
        style={{ maxHeight: 'calc(100vh - 64px)' }}
      >
        {isSidebarCollapsed ? (
          /* Collapsed state - show expand button */
          <button
            onClick={toggleSidebar}
            className="h-full w-full flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:bg-[#2d333b] transition-colors"
            title="Expand sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          /* Expanded state - show all content */
          <>
            {/* Collapse Button */}
            <div className="flex items-center justify-between border-b border-[#373e47] px-4 py-3 flex-shrink-0">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">
                Campaigns & Leads
              </h2>
              <button
                onClick={toggleSidebar}
                className="text-gray-400 hover:text-cyan-400 transition-colors p-1 rounded hover:bg-[#2d333b]"
                title="Collapse sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-cyan-400 text-sm">Loading...</div>
          </div>
        ) : (
          <>
            {/* Campaign Column */}
            <div className="border-b border-[#373e47] px-4 py-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Select Campaign
              </h3>
              <div className="max-h-[300px] space-y-2 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-600">
                {campaignOptions.map((option) => {
                  const isSelected = option.id === selectedCampaignId;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedCampaignId(option.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                        isSelected
                          ? 'border-cyan-500/60 bg-[#11161d] shadow-cyan-500/10'
                          : 'border-[#373e47] hover:border-cyan-500/40 hover:bg-[#161c22]'
                      }`}
                    >
                      {option.id === 'all' ? (
                        // "All Campaigns" special format
                        <>
                          <div className="text-sm font-medium text-white mb-2">
                            {option.name}
                          </div>
                          <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
                            <span>Active Campaigns: {option.activeCampaignCount ?? 0}</span>
                            <span>Leads: {option.leadCount}</span>
                          </div>
                        </>
                      ) : (
                        // Individual campaign format
                        <>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="truncate text-sm font-medium text-white">
                              {option.name}
                            </span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                openCampaignDetails(option.id);
                              }}
                              className="flex-shrink-0 text-xs text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                            >
                              Details
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">
                            Leads: {option.leadCount}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Leads Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Bucket Tabs & Sort */}
              <div className="border-b border-[#373e47] px-4 py-3">
                <div className="flex gap-1.5 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveBucket('leads');
                      setLeadsPage(0);
                    }}
                    className={`flex-1 rounded border px-2 py-1.5 text-[10px] font-medium transition ${
                      activeBucket === 'leads'
                        ? 'border-cyan-500/60 bg-cyan-500/20 text-cyan-300'
                        : 'border-gray-500/40 bg-gray-500/10 text-gray-300 hover:bg-gray-500/20'
                    }`}
                  >
                    Leads ({sortedLeads.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveBucket('cold');
                      setLeadsPage(0);
                    }}
                    className={`flex-1 rounded border px-1.5 py-1.5 text-[10px] font-medium transition flex items-center justify-center gap-0.5 ${
                      activeBucket === 'cold'
                        ? 'border-cyan-500/60 bg-cyan-500/20 text-cyan-300'
                        : 'border-gray-500/40 bg-gray-500/10 text-gray-300 hover:bg-gray-500/20'
                    }`}
                  >
                    <span className="text-xs">❄️</span>
                    <span>Cold ({coldLeads.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveBucket('completed');
                      setLeadsPage(0);
                    }}
                    className={`flex-1 rounded border px-1.5 py-1.5 text-[10px] font-medium transition flex items-center justify-center gap-0.5 ${
                      activeBucket === 'completed'
                        ? 'border-cyan-500/60 bg-cyan-500/20 text-cyan-300'
                        : 'border-gray-500/40 bg-gray-500/10 text-gray-300 hover:bg-gray-500/20'
                    }`}
                  >
                    <span className="text-xs">✓</span>
                    <span>Done ({filteredJobs.completed.length})</span>
                  </button>
                </div>

                {activeBucket === 'leads' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">Sort:</label>
                    <select
                      value={leadSortOrder}
                      onChange={(e) => setLeadSortOrder(e.target.value as 'newest' | 'oldest')}
                      className="flex-1 rounded-md border border-[#373e47] bg-[#0d1117] px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Lead Cards */}
              <div className="flex-1 overflow-y-auto px-4 py-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-600">
                {activeBucket === 'leads' && (
                  <>
                    {sortedLeads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-gray-400 text-sm">No leads yet</p>
                        <p className="mt-2 text-xs text-gray-500">
                          Campaign submissions will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {paginatedLeads.map(renderLeadCard)}
                      </div>
                    )}
                  </>
                )}

                {activeBucket === 'cold' && (
                  <>
                    {coldLeads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-gray-400 text-sm">No cold leads yet</p>
                        <p className="mt-2 text-xs text-gray-500">
                          Unresponsive leads will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {coldLeads.map(renderLeadCard)}
                      </div>
                    )}
                  </>
                )}

                {activeBucket === 'completed' && (
                  <>
                    {filteredJobs.completed.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-gray-400 text-sm">No completed jobs yet</p>
                        <p className="mt-2 text-xs text-gray-500">
                          Completed inspections will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredJobs.completed.map((job) => renderJobCard(job, true))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Pagination */}
              {activeBucket === 'leads' && totalLeadPages > 1 && (
                <div className="border-t border-[#373e47] px-4 py-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setLeadsPage((p) => Math.max(0, p - 1))}
                    disabled={leadsPage === 0}
                    className="rounded-md border border-[#373e47] bg-[#0d1117] px-2 py-1 text-xs font-medium text-white transition hover:bg-[#1e2227] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-gray-400">
                    {leadsPage + 1} / {totalLeadPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLeadsPage((p) => Math.min(totalLeadPages - 1, p + 1))}
                    disabled={leadsPage >= totalLeadPages - 1}
                    className="rounded-md border border-[#373e47] bg-[#0d1117] px-2 py-1 text-xs font-medium text-white transition hover:bg-[#1e2227] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </>
            )}
          </>
        )}
      </div>

      {/* Lead Management Modal */}
      {leadModalState.isOpen && leadModalState.lead && (
        <JobModal
          mode="promote"
          isOpen
          onClose={() => setLeadModalState({ lead: null, isOpen: false })}
          lead={leadModalState.lead}
          defaultStatus="scheduled"
          onContactAttempt={async (leadId: string, attempt: number, isCold?: boolean, inspector?: string | null, internalNotes?: string | null) => {
            // Update contact attempt via API
            if (!user) return;
            try {
              const token = await user.getIdToken();

              await fetch(`/api/dashboard/leads/${leadId}/contact-attempt`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  contactAttempt: attempt,
                  isColdLead: isCold || false,
                  inspector,
                  internalNotes
                }),
              });

              await loadData();
            } catch (error) {
              console.error('Error updating contact attempt:', error);
              throw error;
            }
          }}
          onRemoveFromCalendar={async (leadId: string) => {
            // Remove tentative date
            if (!user) return;
            try {
              const token = await user.getIdToken();
              await fetch(`/api/dashboard/leads/${leadId}/tentative-date`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              await loadData();
            } catch (error) {
              console.error('Error removing from calendar:', error);
            }
          }}
          onSubmit={async ({ status, scheduledInspectionDate, inspector, internalNotes }) => {
            if (!user || !leadModalState.lead) return;
            try {
              const token = await user.getIdToken();

              // This is only called when scheduling (contactAction === 'scheduled')
              // Create a job with the scheduled date
              const response = await fetch('/api/dashboard/jobs', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  leadId: leadModalState.lead.id,
                  status,
                  scheduledInspectionDate,
                  inspector,
                  internalNotes,
                }),
              });

              if (!response.ok) {
                throw new Error('Failed to schedule job');
              }

              await loadData();
              refreshSidebar(); // Notify other components (like calendar) to refresh
              setLeadModalState({ lead: null, isOpen: false });
            } catch (error) {
              console.error('Error saving:', error);
              throw error;
            }
          }}
        />
      )}

      {/* Restore Modal for Cold Leads */}
      {restoreModalState.isOpen && restoreModalState.lead && (
        <RestoreModal
          isOpen={restoreModalState.isOpen}
          onClose={() => setRestoreModalState({ lead: null, isOpen: false })}
          onRestore={async () => {
            if (!user || !restoreModalState.lead) return;
            try {
              const token = await user.getIdToken();
              const response = await fetch(`/api/dashboard/leads/${restoreModalState.lead.id}/restore`, {
                method: 'PATCH',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                throw new Error('Failed to restore lead');
              }

              await loadData();
              refreshSidebar();
            } catch (error) {
              console.error('Error restoring lead:', error);
              throw error;
            }
          }}
          title="Restore Cold Lead"
          name={restoreModalState.lead.name}
          type="cold"
        />
      )}

      {/* Restore Modal for Completed Jobs */}
      {restoreJobModalState.isOpen && restoreJobModalState.job && (
        <RestoreModal
          isOpen={restoreJobModalState.isOpen}
          onClose={() => setRestoreJobModalState({ job: null, isOpen: false })}
          onRestore={async () => {
            if (!user || !restoreJobModalState.job) return;
            try {
              const token = await user.getIdToken();
              const response = await fetch(`/api/dashboard/jobs/${restoreJobModalState.job.id}`, {
                method: 'PATCH',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  status: 'scheduled',
                }),
              });

              if (!response.ok) {
                throw new Error('Failed to restore job');
              }

              await loadData();
              refreshSidebar();
              setRestoreJobModalState({ job: null, isOpen: false });
            } catch (error) {
              console.error('Error restoring job:', error);
              throw error;
            }
          }}
          title="Restore Completed Job"
          name={restoreJobModalState.job.customerName}
          type="completed"
        />
      )}

      {/* Campaign Details Modal */}
      {campaignDetailsModal.isOpen && campaignDetailsModal.campaignId && (
        <CampaignDetailsModal
          isOpen={campaignDetailsModal.isOpen}
          onClose={closeCampaignDetails}
          campaignId={campaignDetailsModal.campaignId}
          onCampaignUpdated={() => {
            loadData();
            refreshSidebar();
          }}
        />
      )}
    </>
  );
}
