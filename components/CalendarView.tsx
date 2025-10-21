'use client';

import { useMemo } from 'react';
// @ts-ignore - react-big-calendar types are incomplete
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
// @ts-ignore - react-big-calendar types are incomplete
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

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

// Wrap Calendar with drag-and-drop functionality
const DnDCalendar = withDragAndDrop(Calendar);

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
  onEventDrop: (event: CalendarEvent, start: Date, end: Date) => void;
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
}

export default function CalendarView({
  events,
  onEventClick,
  onEventDrop,
  onSelectSlot,
}: CalendarViewProps) {
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

    return (
      <div className="flex flex-col gap-1 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold">{event.customerName}</span>
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
    <div className="h-full rounded-lg border border-[#373e47] bg-[#1e2227] p-4">
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
        }

        .rbc-month-view {
          border-color: #373e47;
          background: transparent;
        }

        .rbc-month-row {
          border-color: #373e47 !important;
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
          padding: 16px 0;
          margin-bottom: 16px;
          color: #e5e7eb;
        }

        .rbc-toolbar button {
          color: #e5e7eb;
          background: #2d333b;
          border: 1px solid #373e47;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .rbc-toolbar button:hover {
          background: #373e47;
        }

        .rbc-toolbar button:active,
        .rbc-toolbar button.rbc-active {
          background: #06b6d4;
          color: #000;
          border-color: #0891b2;
        }

        .rbc-event {
          cursor: pointer;
        }

        .rbc-event:hover {
          opacity: 0.9;
        }

        .rbc-show-more {
          background-color: #2d333b;
          color: #06b6d4;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .rbc-overlay {
          background: #1e2227;
          border: 1px solid #373e47;
          border-radius: 8px;
          padding: 8px;
        }
      `}</style>

      <DnDCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '600px' }}
        onSelectEvent={onEventClick}
        onSelectSlot={onSelectSlot}
        selectable
        eventPropGetter={eventStyleGetter}
        components={{
          event: EventComponent,
        }}
        views={['month', 'week', 'day']}
        defaultView="month"
        popup
        onEventDrop={({ event, start, end }: any) => {
          onEventDrop(event as CalendarEvent, start, end);
        }}
        draggableAccessor={() => true}
      />
    </div>
  );
}
