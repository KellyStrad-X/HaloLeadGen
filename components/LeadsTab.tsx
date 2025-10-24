'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useDashboardSidebar } from '@/lib/dashboard-sidebar-context';
import LeadDetailsModal from './LeadDetailsModal';
import JobModal, { type LeadJobStatus } from './JobModal';
import CalendarView, { type CalendarEvent } from './CalendarView';

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
  contactAttempt?: number; // 0 = new, 1 = first, 2 = second, 3 = third
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

// Helper to parse date strings in local timezone (not UTC)
// Handles both YYYY-MM-DD strings and full ISO timestamps
function parseLocalDate(dateStr: string): Date {
  // If it's already a full timestamp (contains 'T'), parse directly
  if (dateStr.includes('T')) {
    return new Date(dateStr);
  }

  // If it's just YYYY-MM-DD, append T12:00:00 to parse as noon local time
  // This avoids calendar showing previous day for negative timezone offsets (US)
  return new Date(`${dateStr}T12:00:00`);
}

export default function LeadsTab() {
  const { user } = useAuth();
  const { selectedCampaignId, draggingItem, setDraggingItem, refreshSidebar } = useDashboardSidebar();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobs, setJobs] = useState<JobBuckets>({
    scheduled: [],
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
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');

  // Auto-scroll when dragging near viewport edges
  useEffect(() => {
    if (!draggingItem) return;

    let animationFrameId: number;
    let mouseY = 0;

    const SCROLL_ZONE = 150; // pixels from edge to trigger scroll
    const SCROLL_SPEED = 20; // pixels per frame - constant speed

    const handleDragOver = (e: DragEvent) => {
      mouseY = e.clientY;
    };

    const autoScroll = () => {
      const viewportHeight = window.innerHeight;
      const distanceFromBottom = viewportHeight - mouseY;
      const distanceFromTop = mouseY;

      let scrollAmount = 0;

      // Near bottom - scroll down at full speed
      if (distanceFromBottom < SCROLL_ZONE && distanceFromBottom > 0) {
        scrollAmount = SCROLL_SPEED;
      }
      // Near top - scroll up at full speed
      else if (distanceFromTop < SCROLL_ZONE && distanceFromTop > 0) {
        scrollAmount = -SCROLL_SPEED;
      }

      if (scrollAmount !== 0) {
        window.scrollBy({ top: scrollAmount, behavior: 'instant' });
      }

      animationFrameId = requestAnimationFrame(autoScroll);
    };

    window.addEventListener('dragover', handleDragOver);
    animationFrameId = requestAnimationFrame(autoScroll);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      cancelAnimationFrame(animationFrameId);
    };
  }, [draggingItem]);

  // Filter jobs by selected campaign

  const filteredJobs = useMemo<JobBuckets>(() => {
    if (selectedCampaignId === 'all') return jobs;
    return {
      scheduled: jobs.scheduled.filter((job) => job.campaignId === selectedCampaignId),
      completed: jobs.completed.filter((job) => job.campaignId === selectedCampaignId),
    };
  }, [jobs, selectedCampaignId]);

  const jobIndex = useMemo(() => groupJobsById(filteredJobs), [filteredJobs]);

  // Convert jobs and tentative leads to calendar events
  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = [];

    // Add confirmed scheduled jobs to calendar
    filteredJobs.scheduled.forEach((job) => {
      if (job.scheduledInspectionDate) {
        const date = parseLocalDate(job.scheduledInspectionDate);
        events.push({
          id: `job-${job.id}`,
          title: job.customerName,
          start: date,
          end: date,
          type: 'confirmed',
          jobId: job.id,
          customerName: job.customerName,
          phone: job.phone,
          email: job.email,
          inspector: job.inspector,
        });
      }
    });

    // Add tentative leads to calendar
    // Build from full leads array (not filteredLeads) to include leads with tentativeDate
    let leadsWithTentativeDate = leads.filter(l => l.tentativeDate && !l.isColdLead);
    // Apply campaign filter if specific campaign selected
    if (selectedCampaignId !== 'all') {
      leadsWithTentativeDate = leadsWithTentativeDate.filter(l => l.campaignId === selectedCampaignId);
    }

    leadsWithTentativeDate.forEach((lead) => {
      const date = parseLocalDate(lead.tentativeDate!);

      events.push({
        id: `lead-${lead.id}`,
        title: lead.name,
        start: date,
        end: date,
        type: 'tentative',
        leadId: lead.id,
        contactAttempt: lead.contactAttempt,
        customerName: lead.name,
        phone: lead.phone,
        email: lead.email,
        inspector: lead.inspector,
      });
    });

    return events;
  }, [filteredJobs.scheduled, leads, selectedCampaignId]);

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
    refreshSidebar();
  }, [isMutating, loadData, refreshSidebar]);

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
        refreshSidebar();
      } catch (err) {
        console.error('Promote lead error', err);
        setError(err instanceof Error ? err.message : 'Failed to promote lead');
      } finally {
        setIsMutating(false);
      }
    },
    [user, loadData, refreshSidebar]
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
        refreshSidebar();
      } catch (err) {
        console.error('Update job error', err);
        setError(err instanceof Error ? err.message : 'Failed to update job');
      } finally {
        setIsMutating(false);
      }
    },
    [user, loadData, refreshSidebar]
  );

  const updateLeadContactAttempt = useCallback(
    async (leadId: string, attempt: number, isCold: boolean) => {
      if (!user) return;
      setIsMutating(true);
      setError(null);
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/dashboard/leads/${leadId}/contact-attempt`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contactAttempt: attempt,
            isColdLead: isCold,
          }),
        });

        if (!response.ok) {
          const message = await response.json().catch(() => ({}));
          console.error('Contact attempt API error:', {
            status: response.status,
            error: message.error,
            leadId,
            attempt,
            isCold,
          });
          throw new Error(message.error || 'Failed to update contact attempt');
        }

        await loadData();
        refreshSidebar();
      } catch (err) {
        console.error('Update contact attempt error', err);
        setError(err instanceof Error ? err.message : 'Failed to update contact attempt');
      } finally {
        setIsMutating(false);
      }
    },
    [user, loadData, refreshSidebar]
  );

  const restoreColdLead = useCallback(
    async (leadId: string) => {
      if (!user) return;
      setIsMutating(true);
      setError(null);
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/dashboard/leads/${leadId}/restore`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const message = await response.json().catch(() => ({}));
          throw new Error(message.error || 'Failed to restore cold lead');
        }

        await loadData();
        refreshSidebar();
      } catch (err) {
        console.error('Restore cold lead error', err);
        setError(err instanceof Error ? err.message : 'Failed to restore cold lead');
      } finally {
        setIsMutating(false);
      }
    },
    [user, loadData, refreshSidebar]
  );

  // Calendar event handlers
  const handleCalendarEventClick = useCallback((event: CalendarEvent) => {
    if (event.jobId) {
      // Open edit modal for confirmed job
      const job = jobIndex.get(event.jobId);
      if (job) {
        setJobModalState({
          mode: 'edit',
          job: {
            ...job,
          },
        });
      }
    } else if (event.leadId) {
      // Open contact modal for tentative lead
      const lead = leads.find((l) => l.id === event.leadId);
      if (lead) {
        setJobModalState({
          mode: 'promote',
          lead: {
            ...lead,
          },
          targetStatus: 'scheduled',
        });
      }
    }
  }, [jobIndex, leads]);

  const handleCalendarEventDrop = useCallback(
    async (event: CalendarEvent, start: Date, end: Date) => {
      if (event.jobId) {
        // Reschedule confirmed job
        await updateJob(event.jobId, {
          scheduledInspectionDate: start.toISOString().slice(0, 10),
        });
      } else if (event.leadId) {
        // Update tentative date for lead
        if (!user) return;

        setIsMutating(true);
        try {
          const token = await user.getIdToken();
          const response = await fetch(`/api/dashboard/leads/${event.leadId}/tentative-date`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              tentativeDate: start.toISOString().slice(0, 10),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to update tentative date');
          }

          await loadData();
          refreshSidebar();
        } catch (err) {
          console.error('Error updating tentative date:', err);
          setError(err instanceof Error ? err.message : 'Failed to update tentative date');
        } finally {
          setIsMutating(false);
        }
      }
    },
    [updateJob, user, loadData, refreshSidebar]
  );

  const handleCalendarSlotSelect = useCallback(
    async (slotInfo: { start: Date; end: Date; droppedItem?: { type: 'lead' | 'job'; id: string } | null }) => {
      // Use droppedItem from the drop event if available (avoids React state timing issues)
      // Otherwise fall back to draggingItem state
      const itemToDrop = (slotInfo as any).droppedItem || draggingItem;

      // If we're dragging a lead, set its tentative date to the selected slot
      if (itemToDrop && itemToDrop.type === 'lead') {
        const lead = leads.find((l) => l.id === itemToDrop.id);
        if (!lead || !user) return;

        const leadId = lead.id; // Store ID to re-fetch after refresh
        const tentativeDate = slotInfo.start.toISOString().slice(0, 10);

        // Optimistic update: immediately set tentativeDate in local state
        const originalLeads = leads;
        setLeads((prevLeads) =>
          prevLeads.map((l) =>
            l.id === leadId ? { ...l, tentativeDate } : l
          )
        );

        setIsMutating(true);
        try {
          const token = await user.getIdToken();
          const response = await fetch(`/api/dashboard/leads/${leadId}/tentative-date`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              tentativeDate,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to set tentative date');
          }

          // Refresh data to get updated lead with tentativeDate
          await loadData();
          refreshSidebar();

          // Modal removed for faster workflow - contractors can drag multiple leads
          // and click them later to contact

          // Only clear drag state if successful
          setDraggingItem(null);
        } catch (err) {
          console.error('Error setting tentative date:', err);
          setError(err instanceof Error ? err.message : 'Failed to set tentative date');
          // Revert optimistic update on error
          setLeads(originalLeads);
          // Keep drag state on error so user knows it failed
        } finally {
          setIsMutating(false);
        }
      }
    },
    [draggingItem, leads, user, loadData, refreshSidebar]
  );

  const handleRemoveFromCalendar = useCallback(
    async (leadId: string) => {
      if (!user) return;

      // Optimistic update: immediately clear tentativeDate in local state
      const originalLeads = leads;
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === leadId ? { ...lead, tentativeDate: null } : lead
        )
      );

      setIsMutating(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/dashboard/leads/${leadId}/tentative-date`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tentativeDate: null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to remove from calendar');
        }

        // Refresh data to get authoritative state from server
        await loadData();
        refreshSidebar();
      } catch (err) {
        console.error('Error removing from calendar:', err);
        setError(err instanceof Error ? err.message : 'Failed to remove from calendar');
        // Revert optimistic update on error
        setLeads(originalLeads);
        throw err; // Re-throw so JobModal can handle it
      } finally {
        setIsMutating(false);
      }
    },
    [user, loadData, leads, refreshSidebar]
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

  const renderJobCard = (job: Job) => (
    <div
      key={job.id}
      draggable
      onDragStart={(event) => {
        setDraggingItem({ type: 'job', id: job.id });
        event.dataTransfer.setData('application/halo-job', job.id);
        event.dataTransfer.effectAllowed = 'move';

        // Set drag image to show the card being dragged
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
        // Remove clone after drag starts (longer delay for browser to capture)
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Calendar - Full Width */}
      <div>
        <div className="relative -mx-16 lg:-mx-24">
          {draggingItem?.type === 'lead' && !draggingItem?.id?.startsWith('lead-') && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-cyan-500/10 border border-cyan-500/40 rounded-lg px-6 py-3 text-center text-sm text-cyan-300 pointer-events-none animate-pulse">
              <svg className="inline-block w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Hover over a date to schedule
            </div>
          )}
          <CalendarView
            events={calendarEvents}
            onEventClick={handleCalendarEventClick}
            onSelectSlot={handleCalendarSlotSelect}
            onDragStateChange={setDraggingItem}
            currentDate={calendarDate}
            currentView={calendarView}
            onDateChange={setCalendarDate}
            onViewChange={setCalendarView}
          />
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
          lead={{
            ...jobModalState.lead,
            id: jobModalState.lead.id,
          }}
          defaultStatus={jobModalState.targetStatus}
          onContactAttempt={updateLeadContactAttempt}
          onRemoveFromCalendar={handleRemoveFromCalendar}
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
          onUnschedule={async (leadId) => {
            if (!user) return;
            setIsMutating(true);
            setError(null);
            try {
              const token = await user.getIdToken();
              const response = await fetch(`/api/dashboard/jobs/${leadId}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                const message = await response.json().catch(() => ({}));
                throw new Error(message.error || 'Failed to unschedule job');
              }

              // Refresh data to show lead back in leads list
              await loadData();
              refreshSidebar();
            } catch (err) {
              console.error('Unschedule job error:', err);
              setError(err instanceof Error ? err.message : 'Failed to unschedule job');
              throw err;
            } finally {
              setIsMutating(false);
            }
          }}
          onMarkAsCold={async (leadId) => {
            if (!user) return;
            setIsMutating(true);
            setError(null);
            try {
              const token = await user.getIdToken();
              const response = await fetch(`/api/dashboard/jobs/${leadId}?action=mark-cold`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                const message = await response.json().catch(() => ({}));
                throw new Error(message.error || 'Failed to mark job as cold');
              }

              // Refresh data to show lead in cold bucket
              await loadData();
              refreshSidebar();
            } catch (err) {
              console.error('Mark job as cold error:', err);
              setError(err instanceof Error ? err.message : 'Failed to mark job as cold');
              throw err;
            } finally {
              setIsMutating(false);
            }
          }}
        />
      )}

    </div>
  );
}
