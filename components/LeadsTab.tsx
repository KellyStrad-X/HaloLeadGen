'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
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
        label: 'NEW',
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
        label: 'NEW',
        className: 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40',
      };
  }
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
  const [activeBucket, setActiveBucket] = useState<'leads' | 'cold' | 'completed'>('leads');
  const [showAllLeadsModal, setShowAllLeadsModal] = useState(false);
  const [showColdBucketModal, setShowColdBucketModal] = useState(false);
  const [showCompletedJobsModal, setShowCompletedJobsModal] = useState(false);
  const [expandedJobSections, setExpandedJobSections] = useState<Record<LeadJobStatus, boolean>>({
    scheduled: true,
    completed: true,
  });

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
    // Filter out cold leads AND leads with tentative dates (those are on calendar)
    const activeLeads = leads.filter((lead) => !lead.isColdLead && !lead.tentativeDate);
    if (selectedCampaignId === 'all') return activeLeads;
    return activeLeads.filter((lead) => lead.campaignId === selectedCampaignId);
  }, [leads, selectedCampaignId]);

  const coldLeads = useMemo(() => {
    const cold = leads.filter((lead) => lead.isColdLead);
    if (selectedCampaignId === 'all') return cold;
    return cold.filter((lead) => lead.campaignId === selectedCampaignId);
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
    console.log('Leads with tentative dates:', leadsWithTentativeDate.length, leadsWithTentativeDate);

    leadsWithTentativeDate.forEach((lead) => {
      const date = parseLocalDate(lead.tentativeDate!);
      console.log(`Creating event for lead ${lead.name}:`, {
        tentativeDate: lead.tentativeDate,
        parsedDate: date,
        isValidDate: !isNaN(date.getTime())
      });

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
      });
    });

    console.log('Total calendar events:', events.length, events);
    return events;
  }, [filteredJobs.scheduled, leads, selectedCampaignId]);

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
      } catch (err) {
        console.error('Update contact attempt error', err);
        setError(err instanceof Error ? err.message : 'Failed to update contact attempt');
      } finally {
        setIsMutating(false);
      }
    },
    [user, loadData]
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
      } catch (err) {
        console.error('Restore cold lead error', err);
        setError(err instanceof Error ? err.message : 'Failed to restore cold lead');
      } finally {
        setIsMutating(false);
      }
    },
    [user, loadData]
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
        } catch (err) {
          console.error('Error updating tentative date:', err);
          setError(err instanceof Error ? err.message : 'Failed to update tentative date');
        } finally {
          setIsMutating(false);
        }
      }
    },
    [updateJob, user, loadData]
  );

  const handleCalendarSlotSelect = useCallback(
    async (slotInfo: { start: Date; end: Date }) => {
      // If we're dragging a lead, set its tentative date to the selected slot
      if (draggingItem && draggingItem.type === 'lead') {
        const lead = leads.find((l) => l.id === draggingItem.id);
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

          // Re-fetch the lead from updated state to get fresh tentativeDate
          // We need to use a slight delay or fetch directly from API since React state updates are async
          // For now, we'll fetch the updated lead list synchronously from the API
          const leadsResponse = await fetch('/api/dashboard/leads', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (leadsResponse.ok) {
            const leadsData = await leadsResponse.json();
            const updatedLead = leadsData.leads?.find((l: Lead) => l.id === leadId);

            if (updatedLead) {
              // Open contact modal with the FRESH lead object that includes tentativeDate
              openPromoteModal(updatedLead, 'scheduled');
            }
          }

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
    [draggingItem, leads, user, loadData, openPromoteModal]
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
    [user, loadData, leads]
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

          // Set drag image to show the card being dragged
          const target = event.currentTarget as HTMLElement;
          const clone = target.cloneNode(true) as HTMLElement;
          clone.style.opacity = '0.8';
          clone.style.width = target.offsetWidth + 'px';
          document.body.appendChild(clone);
          event.dataTransfer.setDragImage(clone, 0, 0);
          setTimeout(() => document.body.removeChild(clone), 0);
        }}
        onDragEnd={() => setDraggingItem(null)}
        className="rounded-lg border border-[#373e47] bg-[#1e2227] p-4 shadow-sm transition ring-cyan-500/40 hover:ring-2"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">{lead.name}</p>
            <p className="text-xs text-gray-400">{lead.campaignName}</p>
          </div>
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badge.className}`}>
            {badge.label}
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
      <div className="mt-4 flex justify-center gap-2">
        {lead.isColdLead ? (
          <button
            type="button"
            onClick={() => restoreColdLead(lead.id)}
            disabled={isMutating}
            className="rounded-md bg-cyan-500 px-6 py-2 text-xs font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔄 RESTORE
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openPromoteModal(lead, 'scheduled')}
            className="rounded-md bg-emerald-500 px-6 py-2 text-xs font-semibold text-black transition hover:bg-emerald-400"
          >
            CONTACT!
          </button>
        )}
      </div>
    </div>
  );
};

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
        clone.style.opacity = '0.8';
        clone.style.width = target.offsetWidth + 'px';
        document.body.appendChild(clone);
        event.dataTransfer.setDragImage(clone, 0, 0);
        setTimeout(() => document.body.removeChild(clone), 0);
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

      <div className="flex items-center justify-end gap-3">
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

      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 md:hidden">
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
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
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

        {/* Right: Leads Section - Drop Zone for Calendar Events */}
        <div
          className={`flex-1 ${activeMobileView === 'jobs' ? 'hidden md:block' : ''} ${
            draggingItem?.id?.startsWith('lead-')
              ? 'ring-2 ring-orange-500/50 bg-orange-500/5 rounded-lg p-4'
              : ''
          }`}
          onDragOver={(e) => {
            // Accept calendar events (tentative leads) being dragged back
            console.log('[LeadsTab] onDragOver - draggingItem:', draggingItem);
            if (draggingItem?.id?.startsWith('lead-')) {
              console.log('[LeadsTab] Accepting drag from calendar');
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }
          }}
          onDrop={async (e) => {
            e.preventDefault();
            console.log('[LeadsTab] onDrop - draggingItem:', draggingItem);
            if (draggingItem?.id?.startsWith('lead-')) {
              const leadId = draggingItem.id.replace('lead-', '');
              console.log('[LeadsTab] Removing lead from calendar:', leadId);
              try {
                // Remove from calendar by clearing tentativeDate
                await handleRemoveFromCalendar(leadId);
                // Only clear drag state if API call succeeds
                setDraggingItem(null);
              } catch (err) {
                console.error('Error removing from calendar:', err);
                // Keep drag state and show error to user
                setError(err instanceof Error ? err.message : 'Failed to remove from calendar');
              }
            } else {
              // No lead being dragged, safe to clear
              setDraggingItem(null);
            }
          }}
        >
          {draggingItem?.id?.startsWith('lead-') && (
            <div className="mb-4 text-center text-sm text-orange-300 font-medium animate-pulse">
              ↓ Drop here to remove from calendar ↓
            </div>
          )}
          {/* Mobile: Bucket Tabs */}
          <div className="mb-4 flex flex-col gap-3 md:hidden">
            {/* Tab Buttons - Mobile Only */}
            <div className="flex gap-1.5">
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
                <span>Completed ({filteredJobs.completed.length})</span>
              </button>
            </div>

            {/* Sort Dropdown - Only for Lead Bucket */}
            {activeBucket === 'leads' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Sort:</label>
                <select
                  value={leadSortOrder}
                  onChange={(e) => setLeadSortOrder(e.target.value as 'newest' | 'oldest')}
                  className="rounded-md border border-[#373e47] bg-[#0d1117] px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            )}
          </div>

          {/* Desktop: Header with buttons */}
          <div className="mb-4 hidden md:flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-6">
              {/* Campaign Stats */}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="text-sm font-semibold text-gray-200">{selectedCampaignName}</span>
                <span>Leads: {leadsCountForSelected}</span>
                <span>Jobs: {jobsCountForSelected}</span>
              </div>

              {/* Leads Header & Sort */}
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
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAllLeadsModal(true)}
                className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/20"
              >
                Lead Bucket
              </button>
              <button
                type="button"
                onClick={() => setShowColdBucketModal(true)}
                className="rounded-md border border-gray-500/40 bg-gray-500/10 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-gray-500/20 flex items-center gap-1.5"
              >
                <span>❄️</span>
                <span>Cold Bucket</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCompletedJobsModal(true)}
                className="rounded-md border border-gray-500/40 bg-gray-500/10 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-gray-500/20 flex items-center gap-1.5"
              >
                <span>✓</span>
                <span>Completed Bucket</span>
              </button>
            </div>
          </div>

          {/* Desktop: Always show leads */}
          <div className="hidden md:block">
            {sortedLeads.length === 0 ? (
              emptyLeadState
            ) : (
              <>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

          {/* Mobile: Display cards based on active bucket */}
          <div className="md:hidden">
            {activeBucket === 'leads' && (
              <>
                {sortedLeads.length === 0 ? (
                  emptyLeadState
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              </>
            )}

            {activeBucket === 'cold' && (
            <>
              {coldLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-gray-400">No cold leads yet</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Leads marked as unresponsive or not interested will appear here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {coldLeads.map(renderLeadCard)}
                </div>
              )}
            </>
          )}

            {activeBucket === 'completed' && (
              <>
                {filteredJobs.completed.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-gray-400">No completed jobs yet</p>
                    <p className="mt-2 text-sm text-gray-500">
                      Jobs marked as completed will appear here
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredJobs.completed.map(renderJobCard)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scheduled Inspections Calendar - Full Width Below with More Spacing */}
      <div className={`mt-8 ${activeMobileView === 'leads' ? 'hidden md:block' : ''}`}>
        <div className="mb-4 flex justify-end">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Scheduled Inspections ({filteredJobs.scheduled.length + leads.filter(l => l.tentativeDate && !l.isColdLead).length})
          </h2>
        </div>

        {/* Calendar - Full Width */}
        <div className="relative -mx-16 lg:-mx-24">
          {draggingItem?.type === 'lead' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-cyan-500/10 border border-cyan-500/40 rounded-lg px-6 py-3 text-center text-sm text-cyan-300 pointer-events-none">
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
          />
        </div>
      </div>

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
                  Lead Bucket ({sortedLeads.length})
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

      {/* Cold Bucket Modal */}
      {showColdBucketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75"
            onClick={() => setShowColdBucketModal(false)}
          />
          <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-lg border border-[#373e47] bg-[#1e2227] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#373e47] p-4 bg-[#2d333b]">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Cold Bucket ({coldLeads.length})
                </h2>
                <p className="text-sm text-gray-400">
                  Unresponsive or not interested leads
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowColdBucketModal(false)}
                className="rounded-md p-2 text-gray-400 transition hover:bg-[#2d333b] hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              {coldLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-gray-400">No cold leads yet</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Leads marked as unresponsive or not interested will appear here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {coldLeads.map(renderLeadCard)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completed Jobs Modal */}
      {showCompletedJobsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75"
            onClick={() => setShowCompletedJobsModal(false)}
          />
          <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-lg border border-[#373e47] bg-[#1e2227] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#373e47] p-4 bg-[#2d333b]">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Completed Bucket ({filteredJobs.completed.length})
                </h2>
                <p className="text-sm text-gray-400">
                  Finished inspections (visible on Halo Map for billing)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompletedJobsModal(false)}
                className="rounded-md p-2 text-gray-400 transition hover:bg-[#2d333b] hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              {filteredJobs.completed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-gray-400">No completed jobs yet</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Jobs marked as completed will appear here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredJobs.completed.map(renderJobCard)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
