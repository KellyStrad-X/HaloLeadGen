'use client';

import { useEffect, useMemo, useState } from 'react';

export type LeadJobStatus = 'scheduled' | 'in_progress' | 'completed';

interface BaseJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    status: LeadJobStatus;
    scheduledInspectionDate: string | null;
    inspector: string | null;
    internalNotes: string | null;
  }) => Promise<void>;
  defaultStatus?: LeadJobStatus;
}

interface PromoteModeProps extends BaseJobModalProps {
  mode: 'promote';
  lead: {
    name: string;
    email: string;
    phone: string;
    address: string | null;
    notes: string | null;
    campaignName: string;
  };
  job?: undefined;
}

interface EditModeProps extends BaseJobModalProps {
  mode: 'edit';
  lead?: undefined;
  job: {
    customerName: string;
    email: string;
    phone: string;
    address: string | null;
    notes: string | null;
    status: LeadJobStatus;
    inspector: string | null;
    scheduledInspectionDate: string | null;
    internalNotes: string | null;
  };
}

type JobModalProps = PromoteModeProps | EditModeProps;

const STATUS_OPTIONS: Array<{ value: LeadJobStatus; label: string }> = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

function normalizeDateValue(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export default function JobModal(props: JobModalProps) {
  const { isOpen, onClose, onSubmit, defaultStatus } = props;
  const [status, setStatus] = useState<LeadJobStatus>(defaultStatus ?? 'scheduled');
  const [scheduledInspectionDate, setScheduledInspectionDate] = useState<string>('');
  const [inspector, setInspector] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = props.mode === 'edit';

  const headerTitle = useMemo(() => {
    if (props.mode === 'edit') {
      return 'Update Job';
    }
    return 'Promote Lead to Job';
  }, [props.mode]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (props.mode === 'promote') {
      setStatus(defaultStatus ?? 'scheduled');
      setScheduledInspectionDate('');
      setInspector('');
      setInternalNotes('');
    } else {
      setStatus(props.job.status);
      setScheduledInspectionDate(normalizeDateValue(props.job.scheduledInspectionDate));
      setInspector(props.job.inspector ?? '');
      setInternalNotes(props.job.internalNotes ?? '');
    }
  }, [isOpen, props, defaultStatus]);

  if (!isOpen) {
    return null;
  }

  const customerName =
    props.mode === 'promote' ? props.lead.name : props.job.customerName;
  const customerEmail =
    props.mode === 'promote' ? props.lead.email : props.job.email;
  const customerPhone =
    props.mode === 'promote' ? props.lead.phone : props.job.phone;
  const customerAddress =
    props.mode === 'promote' ? props.lead.address : props.job.address;
  const customerNotes =
    props.mode === 'promote' ? props.lead.notes : props.job.notes;
  const customerCampaignName =
    props.mode === 'promote' ? props.lead.campaignName : null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        status,
        scheduledInspectionDate: scheduledInspectionDate ? scheduledInspectionDate : null,
        inspector: inspector.trim() ? inspector.trim() : null,
        internalNotes: internalNotes.trim() ? internalNotes.trim() : null,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-6">
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-[#373e47] bg-[#1e2227] shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-[#373e47] px-6 py-4 bg-[#2d333b]">
          <div>
            <h2 className="text-2xl font-semibold text-white">{headerTitle}</h2>
            <p className="text-sm text-gray-400">
              {props.mode === 'promote'
                ? 'Confirm job details before moving this lead into the active workflow.'
                : 'Update scheduling details or mark the job as complete.'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
            aria-label="Close job modal"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Customer
              </h3>
              <p className="mt-2 text-lg font-semibold text-white">{customerName}</p>
              {customerAddress && (
                <p className="text-sm text-gray-400">{customerAddress}</p>
              )}
              <div className="mt-4 space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12A4 4 0 118 12a4 4 0 018 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7m0 0h-3m3 0h3" />
                  </svg>
                  <span>{customerEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h2l3 7-1.34 2.68a1 1 0 00.9 1.45H16" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13h10l4-8H5.4" />
                  </svg>
                  <span>{customerPhone}</span>
                </div>
              </div>
              {customerNotes && (
                <div className="mt-4 rounded-lg border border-[#373e47] bg-[#24292e] p-4 text-sm text-gray-300">
                  <p className="font-medium text-gray-200">Lead Notes</p>
                  <p className="mt-2 whitespace-pre-wrap text-gray-400">{customerNotes}</p>
                </div>
              )}
              {props.mode === 'promote' && customerCampaignName && (
                <div className="mt-4 rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-4 text-sm text-cyan-200">
                  <p className="font-medium text-cyan-100">Campaign</p>
                  <p className="mt-2">{customerCampaignName}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-300" htmlFor="job-status">
                Job Status
              </label>
              <select
                id="job-status"
                className="mt-2 w-full rounded-lg border border-[#373e47] bg-[#0d1117] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={status}
                onChange={(event) => setStatus(event.target.value as LeadJobStatus)}
                disabled={isSubmitting}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300" htmlFor="job-date">
                Scheduled Inspection
              </label>
              <input
                id="job-date"
                type="date"
                className="mt-2 w-full rounded-lg border border-[#373e47] bg-[#0d1117] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={scheduledInspectionDate}
                onChange={(event) => setScheduledInspectionDate(event.target.value)}
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional — helps your team keep track of upcoming inspections.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300" htmlFor="job-inspector">
                Inspector
              </label>
              <input
                id="job-inspector"
                type="text"
                className="mt-2 w-full rounded-lg border border-[#373e47] bg-[#0d1117] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={inspector}
                onChange={(event) => setInspector(event.target.value)}
                placeholder="Who will handle this job?"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300" htmlFor="job-notes">
                Internal Notes
              </label>
              <textarea
                id="job-notes"
                rows={4}
                className="mt-2 w-full rounded-lg border border-[#373e47] bg-[#0d1117] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={internalNotes}
                onChange={(event) => setInternalNotes(event.target.value)}
                placeholder="Add production handoff notes, insurance details, or schedule reminders."
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#373e47] bg-[#1e2227] px-6 py-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg bg-[#2d333b] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#373e47] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-cyan-500 px-6 py-2 text-sm font-semibold text-black transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? 'Saving...'
              : props.mode === 'promote'
              ? 'Promote Lead'
              : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
