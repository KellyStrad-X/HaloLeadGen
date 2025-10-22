'use client';

import { useMemo, useState } from 'react';
// @ts-ignore - react-big-calendar types are incomplete
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export interface CalendarEvent extends Event {
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

export default function CalendarView({
  events,
  onEventClick,
  onSelectSlot,
  onDragStateChange,
  currentDate: externalDate,
  currentView: externalView,
  onDateChange,
  onViewChange,
}: CalendarViewProps) {
  const [internalDate, setInternalDate] = useState(new Date());
  const [internalView, setInternalView] = useState<'month' | 'week'>('month');
  const [isDraggingExternal, setIsDraggingExternal] = useState(false);

  // Prefer external state when provided so parent can control navigation
  const currentDate = externalDate || internalDate;
  const currentView = externalView || internalView;

  // Custom date cell wrapper to accept drops from external sources
  const DateCellWrapper = ({ value, children }: { value: Date; children: React.ReactNode }) => {
    return (
      <div
        className="rbc-day-bg-wrapper"
        onDragOver={(e) => {
          // Accept any dragged items
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          // Add highlight class
          e.currentTarget.classList.add('rbc-drag-over');
        }}
        onDragLeave={(e) => {
          // Remove highlight when drag leaves
          e.currentTarget.classList.remove('rbc-drag-over');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('rbc-drag-over');

          // Fire onSelectSlot with the date of this cell
          // Create end date as same day for single-day selection
          const start = new Date(value);
          start.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
          const end = new Date(start);

          onSelectSlot({ start, end });
        }}
        style={{ height: '100%', width: '100%' }}
      >
        {children}
      </div>
    );
  };

  // Custom toolbar with working navigation
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const goToToday = () => {
      toolbar.onNavigate('TODAY');
    };

    const label = () => {
      return format(currentDate, 'MMMM yyyy');
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
            onClick={goToBack}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-[#2d333b] text-white hover:bg-[#373e47] border border-[#373e47] transition-all"
          >
            ←
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2d333b] text-white hover:bg-[#373e47] border border-[#373e47] transition-all"
          >
            Today
          </button>
          <span className="text-lg font-semibold text-white min-w-[180px] text-center">
            {label()}
          </span>
          <button
            onClick={goToNext}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-[#2d333b] text-white hover:bg-[#373e47] border border-[#373e47] transition-all"
          >
            →
          </button>
        </div>

        {/* Right side - View toggle (Month/Week only) */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              const newView: 'month' | 'week' = 'month';
              if (onViewChange) {
                onViewChange(newView);
              } else {
                setInternalView(newView);
              }
              toolbar.onView(newView);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentView === 'month'
                ? 'bg-cyan-500 text-black'
                : 'bg-[#2d333b] text-white hover:bg-[#373e47] border border-[#373e47]'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => {
              const newView: 'month' | 'week' = 'week';
              if (onViewChange) {
                onViewChange(newView);
              } else {
                setInternalView(newView);
              }
              toolbar.onView(newView);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentView === 'week'
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

  // Custom event styling based on type and contact attempt
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#22c55e'; // Default green for confirmed
    let borderColor = '#16a34a';
    let color = '#000';

    if (event.type === 'tentative') {
      // Color code based on contact attempt
      switch (event.contactAttempt) {
        case 1:
          backgroundColor = '#eab308'; // Yellow
          borderColor = '#ca8a04';
          break;
        case 2:
          backgroundColor = '#f97316'; // Orange
          borderColor = '#ea580c';
          break;
        case 3:
          backgroundColor = '#ef4444'; // Red
          borderColor = '#dc2626';
          break;
        default:
          backgroundColor = '#06b6d4'; // Cyan for new
          borderColor = '#0891b2';
          break;
      }
    } else {
      // Confirmed job - green/blue
      backgroundColor = '#22c55e';
      borderColor = '#16a34a';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        color,
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '0.875rem',
        fontWeight: '600',
      },
    };
  };

  // Custom Popup component - only shows overflow events (not already visible ones)
  const CustomPopup = ({ events, onSelectEvent }: { events: CalendarEvent[]; onSelectEvent: (event: CalendarEvent) => void }) => {
    // react-big-calendar passes all events for the day
    // We want to show only the overflow events (skip the first 3 that are already visible)
    const visibleEventCount = 3; // We show 3 events in the calendar cell
    const overflowEvents = events.slice(visibleEventCount); // Shows events starting from the 4th

    return (
      <div className="overflow-auto max-h-[300px]">
        {overflowEvents.map((event) => (
          <div
            key={event.id}
            onClick={() => onSelectEvent(event)}
            className="cursor-pointer hover:bg-[#373e47] p-2 rounded transition-colors border-b border-[#373e47] last:border-b-0"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm text-white">{event.customerName}</span>
              {event.type === 'tentative' && (
                <span className="text-xs font-bold text-white">
                  {event.contactAttempt === 1 && '1ST'}
                  {event.contactAttempt === 2 && '2ND'}
                  {event.contactAttempt === 3 && '3RD'}
                  {!event.contactAttempt && 'NEW'}
                </span>
              )}
            </div>
            {event.inspector && (
              <span className="text-xs text-gray-400">
                Inspector: {event.inspector}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const badge = event.type === 'tentative' ? (
      <span className="text-xs font-bold">
        {event.contactAttempt === 1 && '1ST'}
        {event.contactAttempt === 2 && '2ND'}
        {event.contactAttempt === 3 && '3RD'}
        {!event.contactAttempt && 'NEW'}
      </span>
    ) : null;

    // For tentative events, wrap in a draggable container
    if (event.type === 'tentative' && event.leadId) {
      return (
        <div
          className="flex flex-col gap-1 overflow-hidden relative h-full w-full"
          draggable={true}
          style={{ cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none' }}
          onDragStart={(e) => {
            e.stopPropagation(); // Prevent calendar from handling
            e.dataTransfer.effectAllowed = 'move';
            // CRITICAL: Must set data for HTML5 drag-and-drop to work
            e.dataTransfer.setData('text/plain', event.id);

            // Create custom drag image for visual feedback
            const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
            dragImage.style.opacity = '0.7';
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            dragImage.style.left = '-1000px';
            dragImage.style.width = e.currentTarget.offsetWidth + 'px';
            dragImage.style.pointerEvents = 'none';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            // Clean up drag image after drag starts
            setTimeout(() => document.body.removeChild(dragImage), 0);

            // Notify parent component about drag state
            console.log('[CalendarView] Starting drag for event:', event.id);
            onDragStateChange?.({ type: 'lead', id: event.id });
            // Change cursor during drag
            (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
          }}
          onDragEnd={(e) => {
            e.stopPropagation(); // Prevent calendar from handling
            onDragStateChange?.(null);
            // Reset cursor
            (e.currentTarget as HTMLElement).style.cursor = 'grab';
          }}
          onClick={(e) => {
            // Allow clicks to open modal while still being draggable
            e.stopPropagation();
            onEventClick(event);
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-semibold text-xs">{event.customerName}</span>
            {badge}
          </div>
          {event.inspector && (
            <span className="text-xs truncate opacity-90">
              Inspector: {event.inspector}
            </span>
          )}
        </div>
      );
    }

    // For confirmed events, no drag
    return (
      <div className="flex flex-col gap-1 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold text-xs">{event.customerName}</span>
          {badge}
        </div>
        {event.inspector && (
          <span className="text-xs truncate opacity-90">
            Inspector: {event.inspector}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className={`h-full rounded-lg border border-[#373e47] bg-[#1e2227] p-4 ${isDraggingExternal ? 'dragging-external-lead' : ''}`}
      onDragEnter={(e) => {
        // Only set dragging state if it's an external drag (from lead list)
        // Calendar event drags will have originated from within the calendar
        const draggedFromCalendar = e.dataTransfer.types.includes('text/plain');
        if (!draggedFromCalendar || e.currentTarget === e.target) {
          setIsDraggingExternal(true);
        }
      }}
      onDragLeave={(e) => {
        // Only clear if leaving the calendar container itself
        if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDraggingExternal(false);
        }
      }}
      onDragOver={(e) => {
        e.preventDefault(); // Allow drop
      }}
      onDrop={() => {
        setIsDraggingExternal(false);
      }}
    >
      <style jsx global>{`
        .rbc-calendar {
          font-family: inherit;
          background: transparent;
        }

        .rbc-header {
          padding: 12px 6px;
          font-weight: 600;
          color: #e5e7eb;
          background: #2d333b;
          border-color: #373e47 !important;
        }

        .rbc-today {
          background-color: #1e3a4f;
        }

        .rbc-off-range-bg {
          background-color: #0d1117;
        }

        .rbc-date-cell {
          color: #9ca3af;
          padding: 8px;
        }

        .rbc-day-bg {
          background: #1e2227;
          border-color: #373e47 !important;
          transition: all 0.2s ease;
          position: relative;
        }

        .rbc-day-bg:hover {
          background: #2d333b;
        }

        /* Custom wrapper for date cells to accept drops */
        .rbc-day-bg-wrapper {
          display: block;
          height: 100%;
          width: 100%;
        }

        /* Highlight date cell when dragging lead over it */
        .rbc-day-bg-wrapper.rbc-drag-over {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.05) 100%) !important;
          border: 2px solid #06b6d4 !important;
          box-shadow: inset 0 0 20px rgba(6, 182, 212, 0.2);
          border-radius: 4px;
        }

        .rbc-month-view {
          border-color: #373e47;
          background: transparent;
        }

        .rbc-month-row {
          border-color: #373e47 !important;
          flex: 1 1 0;
          min-height: 0;
          /* Equal height distribution - each row gets equal share of 1200px */
        }

        .rbc-row-content {
          position: relative;
          max-height: 120px;
          /* Limit to fit 3 events (~30px each) + spacing, then trigger +X more */
          display: flex;
          flex-direction: column;
        }

        /* When dragging external lead, make row content transparent to allow drops */
        .dragging-external-lead .rbc-row-content {
          pointer-events: none;
        }

        /* But keep show-more button interactive even when dragging */
        .dragging-external-lead .rbc-show-more {
          pointer-events: auto;
        }

        .rbc-event-content {
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rbc-time-view {
          border-color: #373e47;
        }

        .rbc-time-header {
          border-color: #373e47 !important;
        }

        .rbc-time-content {
          border-color: #373e47 !important;
        }

        .rbc-current-time-indicator {
          background-color: #06b6d4;
        }

        .rbc-toolbar {
          display: none; /* Hide default toolbar, using custom */
        }

        .rbc-event {
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          position: relative;
          /* Ensure events can be dragged */
          pointer-events: all;
        }

        /* Disable pointer events on calendar events when dragging external lead */
        .dragging-external-lead .rbc-event {
          pointer-events: none;
        }

        .rbc-event:hover {
          opacity: 0.9;
        }

        .rbc-event:active {
          cursor: grabbing;
        }

        /* Make event wrapper fill the space for proper dragging */
        .rbc-event-content {
          height: 100%;
          width: 100%;
        }

        .rbc-show-more {
          background-color: #2d333b;
          color: #06b6d4;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          pointer-events: auto;
        }

        .rbc-show-more:hover {
          background-color: #373e47;
          color: #22d3ee;
        }

        /* Enhanced overlay popup */
        .rbc-overlay {
          background: #1e2227;
          border: 2px solid #06b6d4;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
          z-index: 1000;
          max-height: 400px;
          overflow-y: auto;
          min-width: 300px;
        }

        .rbc-overlay-header {
          color: #06b6d4;
          font-weight: 600;
          margin-bottom: 12px;
          font-size: 0.875rem;
        }
      `}</style>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '1200px' }}
        date={currentDate}
        view={currentView}
        onNavigate={(date: Date) => {
          if (onDateChange) {
            onDateChange(date);
          } else {
            setInternalDate(date);
          }
        }}
        onView={(view: string) => {
          const nextView = view as 'month' | 'week';
          if (onViewChange) {
            onViewChange(nextView);
          } else {
            setInternalView(nextView);
          }
        }}
        onSelectEvent={onEventClick}
        onSelectSlot={onSelectSlot}
        selectable
        eventPropGetter={eventStyleGetter}
        components={{
          event: EventComponent,
          toolbar: CustomToolbar,
          dateCellWrapper: DateCellWrapper,
          popup: CustomPopup,
        }}
        views={{
          month: true,
          week: true,
        }}
        popup
        showMultiDayTimes
      />
    </div>
  );
}
