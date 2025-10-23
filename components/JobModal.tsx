'use client';

import { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuth } from '@/lib/auth-context';

export type LeadJobStatus = 'scheduled' | 'completed';

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
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string | null;
    notes: string | null;
    campaignName: string;
    tentativeDate?: string | null;
    contactAttempt?: number;
  };
  onContactAttempt?: (leadId: string, attempt: number, isCold: boolean, inspector?: string | null, internalNotes?: string | null) => Promise<void>;
  onRemoveFromCalendar?: (leadId: string) => Promise<void>;
  job?: undefined;
}

interface EditModeProps extends BaseJobModalProps {
  mode: 'edit';
  lead?: undefined;
  job: {
    id: string;
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
  onUnschedule?: (jobId: string) => Promise<void>;
  onMarkAsCold?: (jobId: string) => Promise<void>;
}

type JobModalProps = PromoteModeProps | EditModeProps;

const STATUS_OPTIONS: Array<{ value: LeadJobStatus; label: string }> = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
];

function normalizeDateValue(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

// Helper to parse date strings in local timezone (not UTC)
// Appends noon to YYYY-MM-DD strings to avoid timezone shift bugs
function parseLocalDate(dateStr: string): Date {
  // If it's already a full timestamp (contains 'T'), parse directly
  if (dateStr.includes('T')) {
    return new Date(dateStr);
  }
  // If it's just YYYY-MM-DD, append T12:00:00 to parse as noon local time
  // This avoids the date showing as previous day in western timezones
  return new Date(`${dateStr}T12:00:00`);
}

export default function JobModal(props: JobModalProps) {
  const { user } = useAuth();
  const { isOpen, onClose, onSubmit, defaultStatus } = props;
  const [status, setStatus] = useState<LeadJobStatus>(defaultStatus ?? 'scheduled');
  const [scheduledInspectionDate, setScheduledInspectionDate] = useState<Date | null>(null);
  const [inspector, setInspector] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inspectorsList, setInspectorsList] = useState<string[]>([]);
  const [showCustomInspector, setShowCustomInspector] = useState(false);
  const [contactAction, setContactAction] = useState<'uncontacted' | '1st' | '2nd' | '3rd' | 'scheduled' | 'cold'>('uncontacted');
  const isEditMode = props.mode === 'edit';

  const headerTitle = useMemo(() => {
    return 'Lead Management';
  }, [props.mode]);

  // Fetch inspectors list
  useEffect(() => {
    if (isOpen && user) {
      const fetchInspectors = async () => {
        try {
          const token = await user.getIdToken();
          const response = await fetch('/api/contractor-branding', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setInspectorsList(data?.inspectors || []);
          }
        } catch (error) {
          console.error('Error fetching inspectors:', error);
        }
      };
      fetchInspectors();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (props.mode === 'promote') {
      setStatus(defaultStatus ?? 'scheduled');
      // Seed with tentativeDate if available (e.g., when lead was just dragged to calendar)
      const tentativeDateStr = props.lead.tentativeDate;
      setScheduledInspectionDate(tentativeDateStr ? parseLocalDate(tentativeDateStr) : null);
      setInspector('');
      setInternalNotes('');
      setShowCustomInspector(false);

      // Initialize contactAction based on existing contactAttempt
      const attempt = props.lead.contactAttempt || 0;
      if (attempt === 1) setContactAction('1st');
      else if (attempt === 2) setContactAction('2nd');
      else if (attempt === 3) setContactAction('3rd');
      else setContactAction('uncontacted');
    } else {
      setStatus(props.job.status);
      const dateStr = props.job.scheduledInspectionDate;
      setScheduledInspectionDate(dateStr ? parseLocalDate(dateStr) : null);
      const jobInspector = props.job.inspector ?? '';
      setInspector(jobInspector);
      // Show custom input if inspector is not in the list
      setShowCustomInspector(Boolean(jobInspector && !inspectorsList.includes(jobInspector)));
      setInternalNotes(props.job.internalNotes ?? '');
    }
  }, [isOpen, props, defaultStatus, inspectorsList]);

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
    // Validation: If scheduled is selected, date is required
    if (props.mode === 'promote' && contactAction === 'scheduled' && !scheduledInspectionDate) {
      alert('Please select an inspection date when scheduling a job.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Handle contact attempts (uncontacted/1st/2nd/3rd) for promote mode
      if (props.mode === 'promote' && contactAction !== 'scheduled') {
        // Update contact attempt status AND inspector/notes in one call
        if (props.onContactAttempt) {
          const attemptMap: Record<string, number> = { 'uncontacted': 0, '1st': 1, '2nd': 2, '3rd': 3, 'cold': 0 };
          const attempt = attemptMap[contactAction] || 0;
          const isCold = contactAction === 'cold';
          const inspectorValue = inspector.trim() ? inspector.trim() : null;
          const notesValue = internalNotes.trim() ? internalNotes.trim() : null;

          await props.onContactAttempt(props.lead.id, attempt, isCold, inspectorValue, notesValue);
        }

        onClose();
        return;
      }

      // Regular job scheduling/updating
      await onSubmit({
        status,
        scheduledInspectionDate: scheduledInspectionDate ? scheduledInspectionDate.toISOString().slice(0, 10) : null,
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
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-white">{headerTitle}</h2>
              {props.mode === 'promote' && customerCampaignName && (
                <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-500/40">
                  {customerCampaignName}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-400">
              {props.mode === 'promote'
                ? 'View contact details and schedule an inspection.'
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
                Customer & Contact Info
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
                  <a href={`mailto:${customerEmail}`} className="hover:text-cyan-300">{customerEmail}</a>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h2l3 7-1.34 2.68a1 1 0 00.9 1.45H16" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13h10l4-8H5.4" />
                  </svg>
                  <a href={`tel:${customerPhone}`} className="hover:text-cyan-300">{customerPhone}</a>
                </div>
              </div>
            </div>

            {customerNotes && (
              <div className="rounded-lg border border-[#373e47] bg-[#24292e] p-4">
                <p className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Lead Notes</p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">{customerNotes}</p>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-300" htmlFor="contact-status">
                Contact Status
              </label>
              {props.mode === 'promote' ? (
                <>
                  <select
                    id="contact-status"
                    className="mt-2 w-full rounded-lg border border-[#373e47] bg-[#0d1117] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={contactAction === 'cold' ? 'uncontacted' : contactAction}
                    onChange={(event) => setContactAction(event.target.value as typeof contactAction)}
                    disabled={isSubmitting}
                  >
                    <option value="uncontacted">Uncontacted</option>
                    <option value="1st">First Contact Attempt</option>
                    <option value="2nd">Second Contact Attempt</option>
                    <option value="3rd">Third Contact Attempt</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {contactAction === 'uncontacted'
                      ? 'Lead is on calendar but not yet contacted'
                      : contactAction === 'scheduled'
                      ? 'Confirm inspection date and schedule job'
                      : 'Track contact attempt and keep lead active'}
                  </p>
                </>
              ) : (
                <select
                  id="contact-status"
                  className="mt-2 w-full rounded-lg border border-[#373e47] bg-[#0d1117] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as LeadJobStatus)}
                  disabled={isSubmitting}
                >
                  <option value="scheduled">Scheduled</option>
                </select>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300" htmlFor="job-date">
                Scheduled Inspection
              </label>
              <DatePicker
                id="job-date"
                selected={scheduledInspectionDate}
                onChange={(date) => {
                  setScheduledInspectionDate(date);
                  // Automatically set to scheduled when a date is picked
                  if (date && props.mode === 'promote') {
                    setContactAction('scheduled');
                  } else if (!date && props.mode === 'promote' && contactAction === 'scheduled') {
                    // If date is cleared and we were in scheduled mode, reset to uncontacted
                    setContactAction('uncontacted');
                  }
                }}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select a date"
                disabled={isSubmitting}
                className="mt-2 w-full rounded-lg border border-[#373e47] bg-[#0d1117] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                wrapperClassName="w-full"
                calendarClassName="bg-[#1e2227] border-[#373e47]"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional — helps your team keep track of upcoming inspections.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300" htmlFor="job-inspector">
                Inspector
              </label>
              {!showCustomInspector ? (
                <select
                  id="job-inspector"
                  className="mt-2 w-full rounded-lg border border-[#373e47] bg-[#0d1117] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={inspector}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === '__custom__') {
                      setShowCustomInspector(true);
                      setInspector('');
                    } else {
                      setInspector(value);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <option value="">Select an inspector</option>
                  {inspectorsList.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value="__custom__">+ Add custom inspector</option>
                </select>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-lg border border-[#373e47] bg-[#0d1117] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={inspector}
                    onChange={(event) => setInspector(event.target.value)}
                    placeholder="Enter inspector name"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomInspector(false);
                      setInspector('');
                    }}
                    className="rounded-lg border border-[#373e47] bg-[#2d333b] px-4 py-2 text-sm text-gray-300 hover:bg-[#373e47]"
                  >
                    Cancel
                  </button>
                </div>
              )}
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

        <div className="flex justify-between gap-3 border-t border-[#373e47] bg-[#1e2227] px-6 py-4">
          <div className="flex gap-3">
            {props.mode === 'promote' && props.onContactAttempt && (
              <button
                onClick={async () => {
                  if (props.mode === 'promote' && props.onContactAttempt) {
                    setIsSubmitting(true);
                    try {
                      await props.onContactAttempt(props.lead.id, 0, true);
                      onClose();
                    } catch (error) {
                      console.error('Error moving to cold bucket:', error);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }
                }}
                disabled={isSubmitting}
                className="rounded-lg bg-blue-500/10 border border-blue-500/40 px-4 py-2 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2"
                title="Move to Cold Bucket"
              >
                <span>❄️</span>
                <span>Cold Bucket</span>
              </button>
            )}
            {props.mode === 'promote' && props.lead.tentativeDate && props.onRemoveFromCalendar && (
              <button
                onClick={async () => {
                  if (props.mode === 'promote' && props.onRemoveFromCalendar) {
                    setIsSubmitting(true);
                    try {
                      await props.onRemoveFromCalendar(props.lead.id);
                      onClose();
                    } catch (error) {
                      console.error('Error removing from calendar:', error);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }
                }}
                disabled={isSubmitting}
                className="rounded-lg bg-red-500/10 border border-red-500/40 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Remove from Calendar
              </button>
            )}
            {props.mode === 'edit' && (
              <>
                {props.onMarkAsCold && (
                  <button
                    onClick={async () => {
                      if (props.mode === 'edit' && props.onMarkAsCold) {
                        setIsSubmitting(true);
                        try {
                          await props.onMarkAsCold(props.job.id);
                          onClose();
                        } catch (error) {
                          console.error('Error moving job to cold bucket:', error);
                        } finally {
                          setIsSubmitting(false);
                        }
                      }
                    }}
                    disabled={isSubmitting}
                    className="rounded-lg bg-blue-500/10 border border-blue-500/40 px-4 py-2 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2"
                    title="Move to Cold Bucket"
                  >
                    <span>❄️</span>
                    <span>Cold Bucket</span>
                  </button>
                )}
                {props.onUnschedule && (
                  <button
                    onClick={async () => {
                      if (props.mode === 'edit' && props.onUnschedule) {
                        setIsSubmitting(true);
                        try {
                          await props.onUnschedule(props.job.id);
                          onClose();
                        } catch (error) {
                          console.error('Error unscheduling job:', error);
                        } finally {
                          setIsSubmitting(false);
                        }
                      }
                    }}
                    disabled={isSubmitting}
                    className="rounded-lg bg-red-500/10 border border-red-500/40 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Remove from Calendar
                  </button>
                )}
                {status !== 'completed' && (
                  <button
                    onClick={async () => {
                      if (props.mode === 'edit') {
                        setStatus('completed');
                        setIsSubmitting(true);
                        try {
                          await onSubmit({
                            status: 'completed',
                            scheduledInspectionDate: scheduledInspectionDate
                              ? scheduledInspectionDate.toISOString().slice(0, 10)
                              : null,
                            inspector: inspector || null,
                            internalNotes: internalNotes || null,
                          });
                          onClose();
                        } catch (error) {
                          console.error('Error moving to completed:', error);
                        } finally {
                          setIsSubmitting(false);
                        }
                      }
                    }}
                    disabled={isSubmitting}
                    className="rounded-lg bg-green-500/10 border border-green-500/40 px-4 py-2 text-sm font-medium text-green-300 transition-colors hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Move to Completed
                  </button>
                )}
              </>
            )}
          </div>
          <div className="flex gap-3">
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
              className={`rounded-lg px-6 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                props.mode === 'promote' && scheduledInspectionDate
                  ? 'bg-green-500 text-black hover:bg-green-400'
                  : 'bg-cyan-500 text-black hover:bg-cyan-400'
              }`}
            >
              {isSubmitting
                ? 'Saving...'
                : props.mode === 'promote' && scheduledInspectionDate
                ? 'Schedule'
                : props.mode === 'promote'
                ? contactAction === 'cold'
                  ? 'Move to Cold Bucket'
                  : 'Save'
                : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
