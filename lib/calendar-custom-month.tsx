/**
 * Custom Month Component for react-big-calendar
 *
 * ⚠️ MAINTENANCE WARNING ⚠️
 * This file contains a custom Month component that extends react-big-calendar's
 * default Month view to force maxRows={3} for the expand feature.
 *
 * Version: react-big-calendar 1.19.4
 * Source: node_modules/react-big-calendar/lib/Month.js
 *
 * ONLY CHANGE: maxRows={3} instead of showAllEvents ? Infinity : rowLimit
 *
 * When upgrading react-big-calendar:
 * 1. Check Month.js for changes to renderWeek method
 * 2. Manually diff and update this file if needed
 * 3. Test expand feature thoroughly after upgrade
 *
 * DO NOT modify this file unless updating for library upgrade
 * or fixing a critical bug.
 */

'use client';

import React from 'react';
// @ts-ignore
import Month from 'react-big-calendar/lib/Month';

// DEBUG: Verify module is loading
console.log('[calendar-custom-month.tsx] Module loaded', { Month });
// @ts-ignore
import DateContentRow from 'react-big-calendar/lib/DateContentRow';
// @ts-ignore
import { sortWeekEvents, inRange } from 'react-big-calendar/lib/utils/eventLevels';

/**
 * Helper function from Month.js
 * Filters events to only those occurring within the given week
 */
const eventsForWeek = (
  evts: any[],
  start: Date,
  end: Date,
  accessors: any,
  localizer: any
) => {
  return evts.filter((e: any) => inRange(e, start, end, accessors, localizer));
};

/**
 * Custom Month class that overrides renderWeek
 *
 * This is a complete copy of Month.js renderWeek with ONE change:
 * - Line with maxRows prop: forces maxRows={3} instead of dynamic calculation
 */
class CustomMonthClass extends (Month as any) {
  /**
   * Renders a single week row in the month view
   *
   * COPIED FROM: react-big-calendar@1.19.4/lib/Month.js
   * ONLY CHANGE: maxRows={3} (see comment below)
   */
  renderWeek(week: any, weekIdx: number) {
    const {
      events,
      components,
      selectable,
      getNow,
      selected,
      date,
      localizer,
      longPressThreshold,
      accessors,
      getters,
      showAllEvents,
    } = this.props as any;

    const { needLimitMeasure, rowLimit } = this.state;

    // DEBUG: Log to verify CustomMonth is being used
    if (weekIdx === 0) {
      console.log('[CustomMonth] renderWeek called', {
        maxRows: 3,
        showAllEvents,
        rowLimit,
        needLimitMeasure,
        eventsCount: events.length
      });
    }

    // Filter events to just this week
    const weeksEvents = eventsForWeek(
      [...events],
      week[0],
      week[week.length - 1],
      accessors,
      localizer
    );

    // Sort events into levels/extra for proper rendering
    const sorted = sortWeekEvents(weeksEvents, accessors, localizer);

    // DEBUG: Log sorted events for first week
    if (weekIdx === 0) {
      console.log('[CustomMonth] Week events:', {
        weekIdx,
        weeksEvents: weeksEvents.length,
        sorted: sorted.length,
        sortedSample: sorted.slice(0, 5).map((e: any) => e.title || e.customerName)
      });
    }

    return (
      <DateContentRow
        key={weekIdx}
        ref={weekIdx === 0 ? this.slotRowRef : undefined}
        container={this.getContainer}
        className="rbc-month-row"
        getNow={getNow}
        date={date}
        range={week}
        events={sorted}
        // ⭐ ONLY CHANGE: Force 3 visible events instead of dynamic calculation
        // Original: maxRows={showAllEvents ? Infinity : rowLimit}
        maxRows={3}
        selected={selected}
        selectable={selectable}
        components={components}
        accessors={accessors}
        getters={getters}
        localizer={localizer}
        renderHeader={this.readerDateHeading}
        renderForMeasure={needLimitMeasure}
        onShowMore={this.handleShowMore}
        onSelect={this.handleSelectEvent}
        onDoubleClick={this.handleDoubleClickEvent}
        onKeyPress={this.handleKeyPressEvent}
        onSelectSlot={this.handleSelectSlot}
        longPressThreshold={longPressThreshold}
        rtl={this.props.rtl}
        resizable={this.props.resizable}
        showAllEvents={showAllEvents}
      />
    );
  }
}

/**
 * Export custom Month component directly
 * The 'as any' cast is necessary because we're extending an internal class
 */
export const CustomMonth: any = CustomMonthClass;

// CRITICAL: Copy static methods for navigation to work
CustomMonth.range = Month.range;
CustomMonth.navigate = Month.navigate;
CustomMonth.title = Month.title;

// DEBUG: Verify CustomMonth is created
console.log('[calendar-custom-month.tsx] CustomMonth created', {
  CustomMonth,
  hasRange: !!CustomMonth.range,
  hasNavigate: !!CustomMonth.navigate,
  hasTitle: !!CustomMonth.title,
  hasRenderWeek: typeof CustomMonthClass.prototype.renderWeek === 'function'
});
