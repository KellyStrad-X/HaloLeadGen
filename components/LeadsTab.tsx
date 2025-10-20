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
  new: 'bg-[#2d333b] text-gray-300',
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
    description: 'Inspection booked or pending',
    accent: 'border-orange-500/40',
  },
  {
    key: 'in_progress',
    title: 'In Progress',
    description: 'On-site or active production',
    accent: 'border-blue-500/40',
  },
  {
    key: 'completed',
    title: 'Completed',
    description: 'Ready for marketing assets',
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
    in_progress: [],
    completed: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMobileView, setActiveMobileView] = useState<'leads' | 'jobs'>('leads');
  const [leadModalState, setLeadModalState] = useState<{
    leadId: string;
    campaignId: string;
    isOpen: boolean;
  }>({ leadId: '', campaignId: '', isOpen: false });
  const [jobModalState, setJobModalState] = useState<ModalState>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [draggingItem, setDraggingItem] = useState<{ type: 'lead' | 'job'; id: string } | null>(null);

  const jobIndex = useMemo(() => groupJobsById(jobs), [jobs]);

  const loadData = useCallback(async () => {
    if (!user) {
      setLeads([]);
      setJobs({ scheduled: [], in_progress: [], completed: [] });
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
        in_progress: jobsData.jobs?.inProgress ?? [],
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
    if (lead) {
      openPromoteModal(lead, targetStatus);
    }
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
          openPromoteModal(lead, targetStatus);
        }
      }
      return;
    }

    const job = jobIndex.get(jobId);
    if (!job || job.status === targetStatus) {
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
      <div className="mt-4 flex flex-wrap justify-between gap-2">
        <button
          type="button"
          onClick={() => openLeadModal(lead)}
          className="rounded-md bg-[#2d333b] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#373e47]"
        >
          View Lead
        </button>
        <button
          type="button"
          onClick={() => openPromoteModal(lead, 'scheduled')}
          className="rounded-md bg-cyan-500 px-3 py-2 text-xs font-semibold text-black transition hover:bg-cyan-400"
        >
          Promote to Job
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
      <p className="text-sm text-gray-300">No new leads in your queue right now.</p>
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

      <div className="flex flex-col gap-6 md:flex-row">
        <div
          className={`md:w-1/3 ${
            activeMobileView === 'jobs' ? 'hidden md:block' : ''
          }`}
        >
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Leads ({leads.length})
          </h2>
          <div className="space-y-3">
            {leads.length === 0 ? emptyLeadState : leads.map(renderLeadCard)}
          </div>
        </div>

        <div
          className={`flex-1 space-y-4 ${
            activeMobileView === 'leads' ? 'hidden md:block md:space-y-0' : ''
          }`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            {JOB_COLUMNS.map((column) => (
              <div key={column.key} className="flex-1">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
                      {column.title}
                    </h3>
                    <p className="text-xs text-gray-500">{column.description}</p>
                  </div>
                  <span className="rounded-full bg-[#0d1117] px-2 py-1 text-[10px] text-gray-400">
                    {jobs[column.key].length}
                  </span>
                </div>
                <div
                  onDragOver={handleDragOver}
                  onDrop={(event) => handleJobDrop(event, column.key)}
                  className={`min-h-[220px] rounded-xl border border-dashed bg-[#11161d] p-3 transition ${
                    isColumnActive(column.key)
                      ? `border-2 ${column.accent}`
                      : 'border-[#2d333b]'
                  }`}
                >
                  <div className="space-y-3">
                    {jobs[column.key].length === 0 ? (
                      <div className="rounded-md border border-dashed border-[#373e47] bg-[#161c22] p-4 text-center text-xs text-gray-500">
                        Drop a lead or move an existing job here.
                      </div>
                    ) : (
                      jobs[column.key].map(renderJobCard)
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
    </div>
  );
}
