"use client";

import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

interface FullCalendarInnerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allEvents: any[];
  dateRange: { startDate: string | null; endDate: string | null };
  handleDateClick: (arg: { dateStr: string }) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleEventClick: (info: { event: any }) => void;
}

export default function FullCalendarInner({
  allEvents,
  dateRange,
  handleDateClick,
  handleEventClick,
}: FullCalendarInnerProps) {
  // ── 内部クラスの定義状態とプロトタイプを検証するための詳細ログ ──
  console.log("=== FullCalendar Constructor & Module Debug ===", {
    FullCalendarReact: FullCalendar,
    dayGridPlugin: dayGridPlugin,
    // viewsの中に格納されているDayTableViewなどの実体を確認
    dayGridPluginViews: dayGridPlugin?.views,
    // FunctionかClassか、あるいはトランスパイル後の型を確認
    hasNewSupport: typeof FullCalendar === "function",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CalendarComponent = FullCalendar as any;

  return (
    <CalendarComponent
      key={`${dateRange?.startDate}-${dateRange?.endDate}-${allEvents.length}`}
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: "prev",
        center: "title",
        right: "next",
      }}
      locale="ja"
      height="100%"
      contentHeight="100%"
      fixedWeekCount={false}
      dateClick={handleDateClick}
      eventClick={handleEventClick}
      events={allEvents}
      eventContent={(eventInfo: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        event: any;
      }) => {
        const isHoliday = eventInfo.event.extendedProps?.isHoliday;
        const isSeasonal = eventInfo.event.extendedProps?.isSeasonal;

        if (isHoliday) {
          return (
            <div className="text-[9px] font-bold text-red-600 truncate px-0.5 leading-none">
              {eventInfo.event.title}
            </div>
          );
        }

        if (isSeasonal) {
          return (
            <div className="text-[9px] font-medium text-slate-600 truncate px-0.5 leading-none">
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
