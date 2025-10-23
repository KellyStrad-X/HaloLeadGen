'use client';

import React, { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventContentArg, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import { format } from 'date-fns';

// Note: FullCalendar v6+ bundles CSS in JS - no separate CSS imports needed

// Copy CalendarEvent interface from CalendarView.tsx for compatibility
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'tentative' | 'confirmed';
  contactAttempt?: number;
  leadId?: string;
  jobId?: string;
  customerName: string;
  phone: string;
  email: string;
  inspector?: string | null;
}

// Copy CalendarViewProps from CalendarView.tsx for drop-in compatibility
interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
  onDragStateChange?: (item: { type: 'lead'; id: string } | null) => void;
  currentDate?: Date;
  currentView?: 'month' | 'week';
  onDateChange?: (date: Date) => void;
  onViewChange?: (view: 'month' | 'week') => void;
}

export default function FullCalendarView({
  events,
  onEventClick,
  onSelectSlot,
  onDragStateChange,
  currentDate,
  currentView = 'month',
  onDateChange,
  onViewChange,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [internalDate, setInternalDate] = useState(new Date());
  const [internalView, setInternalView] = useState<'month' | 'week'>('month');
  const [isDraggingExternal, setIsDraggingExternal] = useState(false);

  // Prefer external state when provided so parent can control navigation
  const activeDate = currentDate || internalDate;
  const activeView = currentView || internalView;

  // Custom toolbar with working navigation (matching old CalendarView style)
  const CustomToolbar = () => {
    const handlePrev = () => {
      const calendarApi = calendarRef.current?.getApi();
      calendarApi?.prev();
      const newDate = calendarApi?.getDate();
      if (newDate) {
        if (onDateChange) {
          onDateChange(newDate);
        } else {
          setInternalDate(newDate);
        }
      }
    };

    const handleNext = () => {
      const calendarApi = calendarRef.current?.getApi();
      calendarApi?.next();
      const newDate = calendarApi?.getDate();
      if (newDate) {
        if (onDateChange) {
          onDateChange(newDate);
        } else {
          setInternalDate(newDate);
        }
      }
    };

    const handleToday = () => {
      const calendarApi = calendarRef.current?.getApi();
      calendarApi?.today();
      const today = new Date();
      if (onDateChange) {
        onDateChange(today);
      } else {
        setInternalDate(today);
      }
    };

    const handleViewChange = (newView: 'month' | 'week') => {
      const calendarApi = calendarRef.current?.getApi();
      calendarApi?.changeView(newView === 'week' ? 'dayGridWeek' : 'dayGridMonth');
      if (onViewChange) {
        onViewChange(newView);
      } else {
        setInternalView(newView);
      }
    };

    return (
      <div className="flex items-center justify-between mb-4 px-2">
        {/* Left side - Halo branding */}
        <div className="flex items-center gap-3">
          <img
            src="/Halo Logo 2.png"
            alt="Halo"
            className="h-10 w-auto"
          />
        </div>

        {/* Center - Month navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-[#2d333b] text-white hover:bg-[#373e47] border border-[#373e47] transition-all"
          >
            ←
          </button>
          <button
            onClick={handleToday}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2d333b] text-white hover:bg-[#373e47] border border-[#373e47] transition-all"
          >
            Today
          </button>
          <span className="text-lg font-semibold text-white min-w-[180px] text-center">
            {format(activeDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={handleNext}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-[#2d333b] text-white hover:bg-[#373e47] border border-[#373e47] transition-all"
          >
            →
          </button>
        </div>

        {/* Right side - View toggle (Month/Week only) */}
        <div className="flex gap-2">
          <button
            onClick={() => handleViewChange('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'month'
                ? 'bg-cyan-500 text-black'
                : 'bg-[#2d333b] text-white hover:bg-[#373e47] border border-[#373e47]'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => handleViewChange('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'week'
                ? 'bg-cyan-500 text-black'
                : 'bg-[#2d333b] text-white hover:bg-[#373e47] border border-[#373e47]'
            }`}
          >
            Week
          </button>
        </div>
      </div>
    );
  };

  // Custom event rendering with badges and inspector info
  const renderEventContent = (arg: EventContentArg) => {
    const event = arg.event.extendedProps as CalendarEvent;

    return (
      <div className="flex flex-col gap-0.5 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold text-xs">{event.customerName}</span>
          {event.type === 'tentative' && (
            <span className="text-[10px] font-bold">
              {event.contactAttempt === 1 && '1ST'}
              {event.contactAttempt === 2 && '2ND'}
              {event.contactAttempt === 3 && '3RD'}
              {!event.contactAttempt && 'NEW'}
            </span>
          )}
        </div>
        {event.inspector && (
          <span className="text-[10px] truncate opacity-90">
            Inspector: {event.inspector}
          </span>
        )}
      </div>
    );
  };

  // Event styling based on type and contact attempt
  const getEventClassNames = (arg: EventContentArg) => {
    const event = arg.event.extendedProps as CalendarEvent;
    const classes = ['custom-fc-event'];

    if (event.type === 'tentative') {
      switch (event.contactAttempt) {
        case 1:
          classes.push('event-tentative-1st');
          break;
        case 2:
          classes.push('event-tentative-2nd');
          break;
        case 3:
          classes.push('event-tentative-3rd');
          break;
        default:
          classes.push('event-tentative-new');
          break;
      }
    } else {
      classes.push('event-confirmed');
    }

    return classes;
  };

  // Handle external drag enter/leave for visual feedback
  const handleDragEnter = (e: React.DragEvent) => {
    // Check if it's an external drag (not from calendar events)
    const hasLeadData = e.dataTransfer.types.includes('application/halo-lead');
    const hasJobData = e.dataTransfer.types.includes('application/halo-job');

    if ((hasLeadData || hasJobData) && (e.currentTarget === e.target || !e.dataTransfer.types.includes('text/plain'))) {
      setIsDraggingExternal(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingExternal(false);
    }
  };

  return (
    <div
      className={`h-full rounded-lg border border-[#373e47] bg-[#1e2227] p-4 ${isDraggingExternal ? 'dragging-external-lead' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        setIsDraggingExternal(false);
      }}
    >
      <style jsx global>{`
        /* FullCalendar dark theme customization */
        .fc {
          --fc-border-color: #373e47;
          --fc-bg-event-opacity: 1;
          --fc-today-bg-color: rgba(6, 182, 212, 0.1);
          font-family: inherit;
        }

        .fc-theme-standard .fc-scrollgrid {
          border-color: #373e47;
        }

        .fc-col-header-cell {
          background: #2d333b;
          border-color: #373e47 !important;
        }

        .fc-col-header-cell-cushion {
          padding: 12px 6px;
          font-weight: 600;
          color: #e5e7eb;
        }

        .fc-daygrid-day {
          background: #1e2227;
          border-color: #373e47 !important;
          transition: all 0.2s ease;
          min-height: 140px !important; /* Ensure space for 3 events + "+X more" link */
        }

        .fc-daygrid-day:hover {
          background: #2d333b;
        }

        .fc-daygrid-day-frame {
          min-height: 140px !important;
        }

        .fc-daygrid-day.fc-day-today {
          background-color: #1e3a4f !important;
        }

        .fc-daygrid-day.fc-day-other {
          background-color: #0d1117;
        }

        .fc-daygrid-day-number {
          color: #9ca3af;
          padding: 8px;
        }

        /* Event styling */
        .custom-fc-event {
          cursor: pointer;
          border: 2px solid;
          border-radius: 6px;
          padding: 2px 6px;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .custom-fc-event:hover {
          opacity: 0.9;
        }

        /* Tentative events - color coded by contact attempt */
        .event-tentative-new {
          background-color: #06b6d4 !important;
          border-color: #0891b2 !important;
          color: #000 !important;
        }

        .event-tentative-1st {
          background-color: #eab308 !important;
          border-color: #ca8a04 !important;
          color: #000 !important;
        }

        .event-tentative-2nd {
          background-color: #f97316 !important;
          border-color: #ea580c !important;
          color: #000 !important;
        }

        .event-tentative-3rd {
          background-color: #ef4444 !important;
          border-color: #dc2626 !important;
          color: #000 !important;
        }

        /* Confirmed events - green */
        .event-confirmed {
          background-color: #22c55e !important;
          border-color: #16a34a !important;
          color: #000 !important;
        }

        /* Drag highlight for external leads */
        .dragging-external-lead .fc-daygrid-day {
          cursor: copy;
        }

        .fc-highlight {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.05) 100%) !important;
          border: 2px solid #06b6d4 !important;
          box-shadow: inset 0 0 20px rgba(6, 182, 212, 0.2);
        }

        /* Keep events clickable */
        .fc-event {
          pointer-events: auto !important;
          position: relative;
          z-index: 10;
        }

        /* Disable pointer events on calendar events when dragging external lead */
        .dragging-external-lead .fc-event {
          pointer-events: none;
        }

        /* Highlight date cells when dragging over them */
        .fc-day-highlight {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.05) 100%) !important;
          box-shadow: inset 0 0 20px rgba(6, 182, 212, 0.3);
          border: 2px solid #06b6d4 !important;
        }
      `}</style>

      <CustomToolbar />

      <div className="h-[1200px]">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView={activeView === 'week' ? 'dayGridWeek' : 'dayGridMonth'}
          initialDate={activeDate}

          // Show ALL events inline - no "+X more" limit
          dayMaxEventRows={false}

          // Convert events to FullCalendar format
          events={events.map(e => ({
            id: e.id,
            title: e.customerName,
            start: e.start,
            end: e.end,
            extendedProps: e, // Store full event for access later
          }))}

          height="100%"
          headerToolbar={false} // Using custom toolbar above

          // Event interactions
          eventClick={(info: EventClickArg) => {
            const event = info.event.extendedProps as CalendarEvent;
            onEventClick(event);
          }}

          // Date selection for slot clicks
          selectable={true}
          select={(selectInfo: DateSelectArg) => {
            const start = selectInfo.start;
            start.setHours(12, 0, 0, 0);
            const end = new Date(start);
            onSelectSlot({ start, end });
          }}

          // Drag & drop for external leads
          // Note: FullCalendar's droppable doesn't work well with external HTML5 draggables
          // We handle drops via the date cell's native drop event instead
          editable={false}
          droppable={false}

          // Custom date cell handling for drop support
          dayCellDidMount={(arg) => {
            const cell = arg.el;

            // Add drop handlers to each date cell
            cell.addEventListener('dragover', (e) => {
              e.preventDefault();
              // Don't stop propagation - let events handle their own interactions
              cell.classList.add('fc-day-highlight');
            });

            cell.addEventListener('dragleave', (e) => {
              cell.classList.remove('fc-day-highlight');
            });

            cell.addEventListener('drop', (e: any) => {
              e.preventDefault();
              cell.classList.remove('fc-day-highlight');

              const leadId = e.dataTransfer.getData('application/halo-lead');
              const jobId = e.dataTransfer.getData('application/halo-job');

              // Call onSelectSlot with this cell's date AND the item being dragged
              const start = new Date(arg.date);
              start.setHours(12, 0, 0, 0);
              const end = new Date(start);

              // Pass the dropped item info directly to avoid React state timing issues
              onSelectSlot({
                start,
                end,
                // @ts-ignore - Adding droppedItem to bypass state timing
                droppedItem: leadId ? { type: 'lead', id: leadId } : jobId ? { type: 'job', id: jobId } : null
              });
            });
          }}

          // Custom event rendering
          eventContent={renderEventContent}
          eventClassNames={getEventClassNames}

          // View management
          datesSet={(dateInfo) => {
            // Called when view changes or navigation occurs
            // Use currentStart to get the actual month (not the first visible cell)
            const newDate = dateInfo.view.currentStart;
            if (onDateChange && newDate.getTime() !== activeDate.getTime()) {
              onDateChange(newDate);
            }
          }}

          // Week settings
          weekends={true}
          firstDay={0} // Sunday
        />
      </div>
    </div>
  );
}
