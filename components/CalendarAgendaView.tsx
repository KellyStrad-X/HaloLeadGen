'use client';

import { format, isToday, isTomorrow, startOfDay, isWithinInterval, addDays } from 'date-fns';

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

interface CalendarAgendaViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export default function CalendarAgendaView({
  events,
  onEventClick,
}: CalendarAgendaViewProps) {
  // Group events by date (next 14 days)
  const today = startOfDay(new Date());
  const endDate = addDays(today, 14);

  // Filter and sort events within the next 14 days
  const upcomingEvents = events
    .filter((event) =>
      isWithinInterval(startOfDay(event.start), {
        start: today,
        end: endDate,
      })
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // Group by date
  const eventsByDate = upcomingEvents.reduce((acc, event) => {
    const dateKey = format(event.start, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  const dates = Object.keys(eventsByDate).sort();

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMM d');
  };

  const getEventBadgeStyle = (event: CalendarEvent) => {
    if (event.type === 'confirmed') {
      return 'bg-green-500/20 text-green-300 border-green-500/40';
    }
    // Tentative - color by contact attempt
    switch (event.contactAttempt) {
      case 1:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 2:
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 3:
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
  };

  const getEventBadgeLabel = (event: CalendarEvent) => {
    if (event.type === 'confirmed') {
      return 'Confirmed';
    }
    switch (event.contactAttempt) {
      case 1:
        return 'Tentative - 1st';
      case 2:
        return 'Tentative - 2nd';
      case 3:
        return 'Tentative - 3rd';
      default:
        return 'Tentative - New';
    }
  };

  return (
    <div className="bg-[#1e2227] rounded-lg border border-[#373e47] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#373e47]">
        <div className="flex items-center gap-3">
          <img
            src="/Halo Logo 2.png"
            alt="Halo"
            className="h-8 w-auto"
          />
          <h2 className="text-lg font-semibold text-white">Upcoming Schedule</h2>
        </div>
      </div>

      {/* Agenda List */}
      {dates.length === 0 ? (
        <div className="py-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-400 text-sm">No upcoming appointments</p>
          <p className="text-gray-500 text-xs mt-1">Schedule leads to see them here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {dates.map((dateKey) => (
            <div key={dateKey}>
              {/* Date Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-[#373e47]" />
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  {getDateLabel(dateKey)}
                </h3>
                <div className="h-px flex-1 bg-[#373e47]" />
              </div>

              {/* Events for this date */}
              <div className="space-y-2">
                {eventsByDate[dateKey].map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="w-full text-left bg-[#0d1117] border border-[#373e47] rounded-lg p-3 hover:border-cyan-500/40 hover:bg-[#161c22] transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {event.customerName}
                        </p>
                        {event.type === 'confirmed' && event.start && (
                          <p className="text-gray-400 text-xs mt-0.5">
                            ⏰ {format(event.start, 'h:mm a')}
                          </p>
                        )}
                      </div>
                      <span
                        className={`flex-shrink-0 px-2 py-1 rounded text-[10px] font-semibold border ${getEventBadgeStyle(
                          event
                        )}`}
                      >
                        {getEventBadgeLabel(event)}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-gray-400">
                      {event.inspector && (
                        <div className="flex items-center gap-2">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span>Inspector: {event.inspector}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <a
                          href={`tel:${event.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-cyan-400 transition-colors"
                        >
                          {event.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="truncate">{event.email}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Full Calendar Hint (Desktop) */}
      <div className="mt-6 pt-4 border-t border-[#373e47] text-center">
        <p className="text-xs text-gray-500">
          💻 Use desktop for full calendar view with drag & drop scheduling
        </p>
      </div>
    </div>
  );
}
