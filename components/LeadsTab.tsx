'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import LeadDetailsModal from './LeadDetailsModal';
import JobModal, { type LeadJobStatus } from './JobModal';

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
  status: LeadJobStatus;
  scheduledInspectionDate: string | null;
  inspector: string | null;
  internalNotes: string | null;
  promotedAt: string;
  completedAt: string | null;
}

interface JobsResponse {
  jobs: {
    scheduled: Job[];
    inProgress: Job[];
    completed: Job[];
  };
}

type JobBuckets = Record<LeadJobStatus, Job[]>;

interface CampaignSummary {
  id: string;
  name: string;
  newLeadCount: number;
  jobCount: number;
}

interface PromoteModalState {
  mode: 'promote';
  lead: Lead;
  targetStatus: LeadJobStatus;
}

interface EditModalState {
  mode: 'edit';
  job: Job;
}

type ModalState = PromoteModalState | EditModalState | null;

const leadStatusChip: Record<LegacyLeadStatus, string> = {
  new: 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40',
  contacted: 'bg-blue-900/40 text-blue-200',
  scheduled: 'bg-orange-900/40 text-orange-200',
  completed: 'bg-green-900/50 text-green-300',
};

const JOB_COLUMNS: Array<{
  key: LeadJobStatus;
  title: string;
  description: string;
  accent: string;
}> = [
  {
    key: 'scheduled',
    title: 'Scheduled',
    description: 'Pending jobs & inspections',
    accent: 'border-orange-500/40',
  },
  {
    key: 'completed',
    title: 'Completed',
    description: 'Finished jobs (appears on Halo Map)',
    accent: 'border-emerald-500/40',
  },
];

function groupJobsById(jobs: JobBuckets) {
  const index = new Map<string, Job>();
  Object.values(jobs).forEach((list) => {
    list.forEach((job) => {
      index.set(job.id, job);
    });
  });
  return index;
}

export default function LeadsTab() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobs, setJobs] = useState<JobBuckets>({
    scheduled: [],
    completed: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMobileView, setActiveMobileView] = useState<'leads' | 'jobs'>('leads');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [leadModalState, setLeadModalState] = useState<{
    leadId: string;
    campaignId: string;
    isOpen: boolean;
  }>({ leadId: '', campaignId: '', isOpen: false });
  const [jobModalState, setJobModalState] = useState<ModalState>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [draggingItem, setDraggingItem] = useState<{ type: 'lead' | 'job'; id: string } | null>(null);
  const [leadSortOrder, setLeadSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [leadsPage, setLeadsPage] = useState(0);
  const [showAllLeadsModal, setShowAllLeadsModal] = useState(false);
  const [expandedJobSections, setExpandedJobSections] = useState<Record<LeadJobStatus, boolean>>({
    scheduled: true,
    completed: true,
  });

  const campaignSummaries = useMemo<CampaignSummary[]>(() => {
    const map = new Map<string, CampaignSummary>();

    const upsert = (id: string, name: string) => {
      if (!map.has(id)) {
        map.set(id, {
          id,
          name,
          newLeadCount: 0,
          jobCount: 0,
        });
      }
    };

    leads.forEach((lead) => {
      upsert(lead.campaignId, lead.campaignName);
      const entry = map.get(lead.campaignId)!;
      entry.newLeadCount += 1;
    });

    Object.values(jobs).forEach((list) => {
      list.forEach((job) => {
        upsert(job.campaignId, job.campaignName);
        const entry = map.get(job.campaignId)!;
        entry.jobCount += 1;
      });
    });

    const result = Array.from(map.values());
    result.sort((a, b) => {
      if (a.newLeadCount !== b.newLeadCount) {
        return b.newLeadCount - a.newLeadCount;
      }
      if (a.jobCount !== b.jobCount) {
        return b.jobCount - a.jobCount;
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [leads, jobs]);

  const campaignOptions = useMemo(() => {
    const totalJobs = jobs.scheduled.length + jobs.completed.length;

    return [
      {
        id: 'all',
        name: 'All Campaigns',
        newLeadCount: leads.length,
        jobCount: totalJobs,
      },
      ...campaignSummaries,
    ];
  }, [campaignSummaries, leads.length, jobs]);

  const selectedCampaignName = useMemo(() => {
    if (selectedCampaignId === 'all') {
      return 'All Campaigns';
    }
    const match = campaignSummaries.find((campaign) => campaign.id === selectedCampaignId);
    return match?.name ?? 'All Campaigns';
  }, [selectedCampaignId, campaignSummaries]);

  const filteredLeads = useMemo(() => {
    if (selectedCampaignId === 'all') return leads;
    return leads.filter((lead) => lead.campaignId === selectedCampaignId);
  }, [leads, selectedCampaignId]);

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
  }, [selectedCampaignId, leadSortOrder]);

  // Clamp page when total pages changes (e.g., leads promoted, data changes)
  useEffect(() => {
    if (totalLeadPages === 0) {
      setLeadsPage(0);
    } else if (leadsPage >= totalLeadPages) {
      setLeadsPage(Math.max(0, totalLeadPages - 1));
    }
  }, [totalLeadPages, leadsPage]);

  const filteredJobs = useMemo<JobBuckets>(() => {
    if (selectedCampaignId === 'all') return jobs;
    return {
      scheduled: jobs.scheduled.filter((job) => job.campaignId === selectedCampaignId),
      completed: jobs.completed.filter((job) => job.campaignId === selectedCampaignId),
    };
  }, [jobs, selectedCampaignId]);

  const jobIndex = useMemo(() => groupJobsById(filteredJobs), [filteredJobs]);
  const leadsCountForSelected = filteredLeads.length;
  const jobsCountForSelected =
    filteredJobs.scheduled.length + filteredJobs.completed.length;

  useEffect(() => {
    if (selectedCampaignId === 'all') {
      return;
    }
    const exists = campaignSummaries.some((campaign) => campaign.id === selectedCampaignId);
    if (!exists) {
      setSelectedCampaignId('all');
    }
  }, [campaignSummaries, selectedCampaignId]);

  const loadData = useCallback(async () => {
    if (!user) {
      setLeads([]);
      setJobs({ scheduled: [], completed: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const [leadsResponse, jobsResponse] = await Promise.all([
        fetch('/api/dashboard/leads', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/dashboard/jobs', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!leadsResponse.ok) {
        const payload = await leadsResponse.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to load leads');
      }

      if (!jobsResponse.ok) {
        const payload = await jobsResponse.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to load jobs');
      }

      const leadsData = await leadsResponse.json();
      const jobsData: JobsResponse = await jobsResponse.json();

      setLeads(leadsData.leads ?? []);
      setJobs({
        scheduled: jobsData.jobs?.scheduled ?? [],
        completed: jobsData.jobs?.completed ?? [],
      });
    } catch (err) {
      console.error('Error loading leads/jobs', err);
      setError(err instanceof Error ? err.message : 'Failed to load leads and jobs');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshData = useCallback(async () => {
    if (isMutating) return;
    await loadData();
  }, [isMutating, loadData]);

  const openLeadModal = (lead: Lead) => {
    setLeadModalState({ leadId: lead.id, campaignId: lead.campaignId, isOpen: true });
  };

  const closeLeadModal = () => {
    setLeadModalState({ leadId: '', campaignId: '', isOpen: false });
  };

  const openPromoteModal = (lead: Lead, targetStatus: LeadJobStatus) => {
    setJobModalState({ mode: 'promote', lead, targetStatus });
  };

  const openEditModal = (job: Job) => {
    setJobModalState({ mode: 'edit', job });
  };

  const closeJobModal = () => {
    setJobModalState(null);
  };

  const promoteLead = useCallback(
    async (
      leadId: string,
      payload: {
        status: LeadJobStatus;
        scheduledInspectionDate: string | null;
        inspector: string | null;
        internalNotes: string | null;
      }
    ) => {
      if (!user) return;
      setIsMutating(true);
      setError(null);
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/dashboard/jobs', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leadId,
            status: payload.status,
            scheduledInspectionDate: payload.scheduledInspectionDate,
            inspector: payload.inspector,
            internalNotes: payload.internalNotes,
          }),
        });

        if (!response.ok) {
          const message = await response.json().catch(() => ({}));
          throw new Error(message.error || 'Failed to promote lead');
        }

        await loadData();
      } catch (err) {
        console.error('Promote lead error', err);
        setError(err instanceof Error ? err.message : 'Failed to promote lead');
      } finally {
        setIsMutating(false);
      }
    },
    [user, loadData]
  );

  const updateJob = useCallback(
    async (
      jobId: string,
      payload: {
        status?: LeadJobStatus;
        scheduledInspectionDate?: string | null;
        inspector?: string | null;
        internalNotes?: string | null;
      }
    ) => {
      if (!user) return;
      setIsMutating(true);
      setError(null);
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/dashboard/jobs/${jobId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const message = await response.json().catch(() => ({}));
          throw new Error(message.error || 'Failed to update job');
        }

        await loadData();
      } catch (err) {
        console.error('Update job error', err);
        setError(err instanceof Error ? err.message : 'Failed to update job');
      } finally {
        setIsMutating(false);
      }
    },
    [user, loadData]
  );

  const handleLeadDrop = (event: React.DragEvent<HTMLDivElement>, targetStatus: LeadJobStatus) => {
    event.preventDefault();
    setDraggingItem(null);
    const leadId = event.dataTransfer.getData('application/halo-lead');
    if (!leadId) {
      return;
    }
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) {
      return;
    }
    if (selectedCampaignId !== 'all' && lead.campaignId !== selectedCampaignId) {
      return;
    }
    openPromoteModal(lead, targetStatus);
  };

  const handleJobDrop = async (
    event: React.DragEvent<HTMLDivElement>,
    targetStatus: LeadJobStatus
  ) => {
    event.preventDefault();
    setDraggingItem(null);

    const jobId = event.dataTransfer.getData('application/halo-job');
    if (!jobId) {
      const leadId = event.dataTransfer.getData('application/halo-lead');
      if (leadId) {
        const lead = leads.find((item) => item.id === leadId);
        if (lead) {
          if (selectedCampaignId !== 'all' && lead.campaignId !== selectedCampaignId) {
            return;
          }
          openPromoteModal(lead, targetStatus);
        }
      }
      return;
    }

    const job = jobIndex.get(jobId);
    if (!job) {
      return;
    }
    if (selectedCampaignId !== 'all' && job.campaignId !== selectedCampaignId) {
      return;
    }
    if (job.status === targetStatus) {
      return;
    }

    await updateJob(jobId, { status: targetStatus });
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (
      event.dataTransfer.types.includes('application/halo-lead') ||
      event.dataTransfer.types.includes('application/halo-job')
    ) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }
  };

  const isColumnActive = (status: LeadJobStatus) => {
    if (!draggingItem) return false;

    if (draggingItem.type === 'lead') {
      return true;
    }

    const job = jobIndex.get(draggingItem.id);
    if (!job) return false;
    return job.status !== status;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-cyan-400">Loading pipeline...</div>
      </div>
    );
  }

  const renderLeadCard = (lead: Lead) => (
    <div
      key={lead.id}
      draggable
      onDragStart={(event) => {
        setDraggingItem({ type: 'lead', id: lead.id });
        event.dataTransfer.setData('application/halo-lead', lead.id);
        event.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => setDraggingItem(null)}
      className="rounded-lg border border-[#373e47] bg-[#1e2227] p-4 shadow-sm transition ring-cyan-500/40 hover:ring-2"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{lead.name}</p>
          <p className="text-xs text-gray-400">{lead.campaignName}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${leadStatusChip[lead.jobStatus]}`}>
          {lead.jobStatus.toUpperCase()}
        </span>
      </div>
      <div className="mt-3 space-y-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12A4 4 0 118 12a4 4 0 018 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7m0 0h-3m3 0h3" />
          </svg>
          <a className="hover:text-cyan-300" href={`mailto:${lead.email}`}>
            {lead.email}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h2l3 7-1.34 2.68a1 1 0 00.9 1.45H16" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13h10l4-8H5.4" />
          </svg>
          <a className="hover:text-cyan-300" href={`tel:${lead.phone}`}>
            {lead.phone}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          <span className="line-clamp-1">{lead.address ?? 'Address not provided'}</span>
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={() => openPromoteModal(lead, 'scheduled')}
          className="rounded-md bg-emerald-500 px-6 py-2 text-xs font-semibold text-black transition hover:bg-emerald-400"
        >
          CONTACT!
        </button>
      </div>
    </div>
  );

  const renderJobCard = (job: Job) => (
    <div
      key={job.id}
      draggable
      onDragStart={(event) => {
        setDraggingItem({ type: 'job', id: job.id });
        event.dataTransfer.setData('application/halo-job', job.id);
        event.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => setDraggingItem(null)}
      className="rounded-lg border border-[#373e47] bg-[#1e2227] p-4 shadow-sm transition ring-blue-500/40 hover:ring-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{job.customerName}</p>
          <p className="text-xs text-gray-400">{job.campaignName}</p>
        </div>
        <span className="rounded-full bg-[#0d1117] px-2 py-1 text-[10px] font-semibold uppercase text-gray-300">
          {job.status.replace('_', ' ')}
        </span>
      </div>
      <div className="mt-3 space-y-2 text-xs text-gray-400">
        {job.scheduledInspectionDate && (
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>
              Inspection:{' '}
              <span className="text-gray-200">
                {new Date(job.scheduledInspectionDate).toLocaleDateString()}
              </span>
            </span>
          </div>
        )}
        {job.inspector && (
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <span>Inspector: {job.inspector}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12A4 4 0 118 12a4 4 0 018 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7m0 0h-3m3 0h3" />
          </svg>
          <a className="hover:text-cyan-300" href={`mailto:${job.email}`}>
            {job.email}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h2l3 7-1.34 2.68a1 1 0 00.9 1.45H16" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13h10l4-8H5.4" />
          </svg>
          <a className="hover:text-cyan-300" href={`tel:${job.phone}`}>
            {job.phone}
          </a>
        </div>
        {job.internalNotes && (
          <p className="mt-2 rounded-md bg-[#11161d] p-2 text-[11px] text-gray-300">
            {job.internalNotes}
          </p>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => openEditModal(job)}
          className="rounded-md bg-[#2d333b] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#373e47]"
          disabled={isMutating}
        >
          Edit
        </button>
        {job.status !== 'completed' && (
          <button
            type="button"
            onClick={() => updateJob(job.id, { status: 'completed' })}
            className="rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-60"
            disabled={isMutating}
          >
            Mark Completed
          </button>
        )}
      </div>
    </div>
  );

  const emptyLeadState = (
    <div className="rounded-lg border border-dashed border-[#373e47] bg-[#0d1117] p-6 text-center">
      <p className="text-sm text-gray-300">
        {selectedCampaignId === 'all'
          ? 'No new leads in your queue right now.'
          : `No new leads for ${selectedCampaignName}.`}
      </p>
      <p className="mt-2 text-xs text-gray-500">
        Campaign submissions will appear here ready to drag into the job pipeline.
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Lead Pipeline</h1>
          <p className="text-sm text-gray-400">
            Drag leads into the job board to schedule inspections and track progress.
          </p>
        </div>
        <div className="md:hidden">
          <div className="flex rounded-lg border border-[#373e47] bg-[#0d1117] p-1 text-xs font-medium text-gray-400">
            <button
              type="button"
              className={`flex-1 rounded-md px-3 py-1 transition ${
                activeMobileView === 'leads'
                  ? 'bg-cyan-500 text-black'
                  : 'hover:bg-[#1e2227]'
              }`}
              onClick={() => setActiveMobileView('leads')}
            >
              Leads
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md px-3 py-1 transition ${
                activeMobileView === 'jobs'
                  ? 'bg-cyan-500 text-black'
                  : 'hover:bg-[#1e2227]'
              }`}
              onClick={() => setActiveMobileView('jobs')}
            >
              Jobs
            </button>
          </div>
      </div>
    </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
        <span className="text-sm font-semibold text-gray-200">{selectedCampaignName}</span>
        <span>Leads: {leadsCountForSelected}</span>
        <span>Jobs: {jobsCountForSelected}</span>
      </div>

      <div className="md:hidden">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
          Campaign
        </label>
        <select
          value={selectedCampaignId}
          onChange={(event) => setSelectedCampaignId(event.target.value)}
          className="w-full rounded-lg border border-[#373e47] bg-[#0d1117] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {campaignOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name} — {option.newLeadCount} leads / {option.jobCount} jobs
            </option>
          ))}
        </select>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Left: Campaigns Column */}
        <div className="hidden md:block md:w-64 md:flex-shrink-0">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Campaigns
          </h2>
          <div className="max-h-[600px] space-y-2 overflow-y-auto pr-2">
            {campaignOptions.map((option) => {
              const isSelected = option.id === selectedCampaignId;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedCampaignId(option.id)}
                  className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                    isSelected
                      ? 'border-cyan-500/60 bg-[#11161d] shadow-cyan-500/10'
                      : 'border-[#373e47] hover:border-cyan-500/40 hover:bg-[#161c22]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white">{option.name}</span>
                    {option.newLeadCount > 0 && (
                      <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">
                        +{option.newLeadCount}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {option.jobCount} {option.jobCount === 1 ? 'job' : 'jobs'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Leads Section */}
        <div className={`flex-1 ${activeMobileView === 'jobs' ? 'hidden md:block' : ''}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                Leads ({sortedLeads.length})
              </h2>
              <select
                value={leadSortOrder}
                onChange={(e) => setLeadSortOrder(e.target.value as 'newest' | 'oldest')}
                className="rounded-md border border-[#373e47] bg-[#0d1117] px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowAllLeadsModal(true)}
              className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/20"
            >
              View All Leads
            </button>
          </div>

          {sortedLeads.length === 0 ? (
            emptyLeadState
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {paginatedLeads.map(renderLeadCard)}
              </div>

              {totalLeadPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setLeadsPage((p) => Math.max(0, p - 1))}
                    disabled={leadsPage === 0}
                    className="rounded-md border border-[#373e47] bg-[#0d1117] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#1e2227] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Previous
                  </button>
                  <span className="text-xs text-gray-400">
                    Page {leadsPage + 1} of {totalLeadPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLeadsPage((p) => Math.min(totalLeadPages - 1, p + 1))}
                    disabled={leadsPage >= totalLeadPages - 1}
                    className="rounded-md border border-[#373e47] bg-[#0d1117] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#1e2227] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Jobs Pipeline - Full Width Below */}
      <div className={`${activeMobileView === 'leads' ? 'hidden md:block' : ''}`}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Jobs Pipeline ({jobsCountForSelected})
        </h2>
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
          {JOB_COLUMNS.map((column) => {
            const isExpanded = expandedJobSections[column.key];
            const jobsInSection = filteredJobs[column.key];
            return (
              <div
                key={column.key}
                className={`flex-1 rounded-lg border bg-[#0d1117] transition ${column.accent}`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedJobSections((prev) => ({
                      ...prev,
                      [column.key]: !prev[column.key],
                    }))
                  }
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`h-4 w-4 text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
                        {column.title}
                      </h3>
                      <p className="hidden text-xs text-gray-500 lg:block">{column.description}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#1e2227] px-3 py-1 text-xs font-semibold text-gray-300">
                    {jobsInSection.length}
                  </span>
                </button>

                {isExpanded && (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(event) => handleJobDrop(event, column.key)}
                    className={`border-t p-4 transition ${
                      isColumnActive(column.key)
                        ? 'border-2 border-dashed border-cyan-500/40 bg-cyan-500/5'
                        : 'border-[#2d333b]'
                    }`}
                  >
                    {jobsInSection.length === 0 ? (
                      <div className="rounded-md border border-dashed border-[#373e47] bg-[#161c22] p-6 text-center text-xs text-gray-500">
                        Drop a lead or move an existing job here.
                      </div>
                    ) : (
                      <div className="max-h-[500px] space-y-3 overflow-y-auto pr-2">
                        {jobsInSection.map(renderJobCard)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lead Modal */}
      {leadModalState.isOpen && (
        <LeadDetailsModal
          isOpen={leadModalState.isOpen}
          leadId={leadModalState.leadId}
          campaignId={leadModalState.campaignId}
          onClose={closeLeadModal}
          onLeadUpdated={refreshData}
        />
      )}

      {/* Job Modals */}
      {jobModalState?.mode === 'promote' && (
        <JobModal
          mode="promote"
          isOpen
          onClose={closeJobModal}
          lead={jobModalState.lead}
          defaultStatus={jobModalState.targetStatus}
          onSubmit={async ({ status, scheduledInspectionDate, inspector, internalNotes }) => {
            await promoteLead(jobModalState.lead.id, {
              status,
              scheduledInspectionDate,
              inspector,
              internalNotes,
            });
          }}
        />
      )}

      {jobModalState?.mode === 'edit' && (
        <JobModal
          mode="edit"
          isOpen
          onClose={closeJobModal}
          job={jobModalState.job}
          defaultStatus={jobModalState.job.status}
          onSubmit={async ({ status, scheduledInspectionDate, inspector, internalNotes }) => {
            await updateJob(jobModalState.job.id, {
              status,
              scheduledInspectionDate,
              inspector,
              internalNotes,
            });
          }}
        />
      )}

      {/* View All Leads Modal */}
      {showAllLeadsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75"
            onClick={() => setShowAllLeadsModal(false)}
          />
          <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-lg border border-[#373e47] bg-[#1e2227] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#373e47] p-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  All Leads ({sortedLeads.length})
                </h2>
                <p className="text-sm text-gray-400">
                  {selectedCampaignId === 'all' ? 'All campaigns' : selectedCampaignName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllLeadsModal(false)}
                className="rounded-md p-2 text-gray-400 transition hover:bg-[#2d333b] hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sortedLeads.map(renderLeadCard)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
