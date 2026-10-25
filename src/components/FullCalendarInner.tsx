"use client";

import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

interface FullCalendarInnerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allEvents: any[];
  dateRange: { startDate: string | null; endDate: string | null };
  selectedDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  handleDateClick: (arg: { dateStr: string }) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleEventClick: (info: { event: any }) => void;
}

export default function FullCalendarInner({
  allEvents,
  dateRange,
  selectedDate,
  startDate,
  endDate,
  handleDateClick,
  handleEventClick,
}: FullCalendarInnerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CalendarComponent = FullCalendar as any;

  return (
    <CalendarComponent
      key={`${dateRange?.startDate}-${dateRange?.endDate}-${allEvents.length}-${selectedDate}`}
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: "prev",
        center: "title",
        right: "next",
      }}
      locale="ja"
      height={500}
      dayMaxEvents={2} // または 3（1日あたりに表示する最大イベント数）
      fixedWeekCount={true}
      expandRows={true}
      dateClick={handleDateClick}
      eventClick={handleEventClick}
      events={allEvents}
      dayCellClassNames={(arg: { date: Date }) => {
        const classes: string[] = [];

        const year = arg.date.getFullYear();
        const month = String(arg.date.getMonth() + 1).padStart(2, "0");
        const day = String(arg.date.getDate()).padStart(2, "0");
        const cellDateStr = `${year}-${month}-${day}`;

        // 1. 範囲選択・単一選択の判定
        if (startDate) {
          if (endDate) {
            if (cellDateStr >= startDate && cellDateStr <= endDate) {
              if (cellDateStr === startDate && cellDateStr === endDate) {
                classes.push("selected-single-cell");
              } else if (cellDateStr === startDate) {
                classes.push("selected-start-cell");
              } else if (cellDateStr === endDate) {
                classes.push("selected-end-cell");
              } else {
                classes.push("selected-middle-cell");
              }
            }
          } else {
            if (cellDateStr === startDate) {
              classes.push("selected-single-cell");
            }
          }
        }

        // 2. 祝日判定
        const isHoliday = allEvents.some(
          (ev) => ev.start === cellDateStr && ev.extendedProps?.isHoliday,
        );
        if (isHoliday) {
          classes.push("fc-day-holiday");
        }

        // 3. 曜日判定 (土曜日・日曜日)
        const dayOfWeek = arg.date.getDay();
        if (dayOfWeek === 6) {
          classes.push("fc-day-saturday");
        } else if (dayOfWeek === 0) {
          classes.push("fc-day-sunday");
        }

        return classes;
      }}
      eventContent={(eventInfo: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        event: any;
      }) => {
        const isHoliday = eventInfo.event.extendedProps?.isHoliday;
        const isSeasonal = eventInfo.event.extendedProps?.isSeasonal;

        if (isHoliday) {
          return (
            <div className="text-[9px] font-bold text-red-600 whitespace-normal break-all leading-tight px-0.5">
              {eventInfo.event.title}
            </div>
          );
        }

        if (isSeasonal) {
          return (
            <div className="text-[9px] font-medium text-slate-600 whitespace-normal break-all leading-tight px-0.5">
              {eventInfo.event.title}
            </div>
          );
        }

        return (
          <div className="w-full px-0.5 truncate text-[10px] font-bold text-white leading-none">
            {eventInfo.event.title}
          </div>
        );
      }}
    />
  );
}
