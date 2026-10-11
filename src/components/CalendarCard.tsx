"use client";

import React from "react";
import dynamic from "next/dynamic";
// import holidayJp from "@holiday-jp/holiday_jp"; // ← 一時的にコメントアウト
// import { SEASONAL_EVENTS } from "../utils/seasonalEvents"; // ← 一時的にコメントアウト

// プラグインを含むカレンダー実体をSSR無効のdynamicで完全に分離ロード
const FullCalendarInner = dynamic(() => import("./FullCalendarInner"), {
  ssr: false,
});

interface Plan {
  id: string | number;
  title: string;
  date?: string;
  dateRange?: { startDate?: string; endDate?: string };
  location?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  todos?: any[];
}

interface CalendarCardProps {
  onDateSelect?: (dateStr: string) => void;
  onPlanSelect?: (plan: Plan) => void;
  dateRange?: { startDate: string | null; endDate: string | null };
  plans?: Plan[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events?: any[];
}

export default function CalendarCard({
  onDateSelect,
  onPlanSelect,
  dateRange = { startDate: null, endDate: null },
  plans = [],
  events = [],
}: CalendarCardProps) {
  const handleDateClick = (arg: { dateStr: string }) => {
    if (onDateSelect) {
      onDateSelect(arg.dateStr);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEventClick = (info: { event: any }) => {
    const planId = info.event.id;
    const targetPlan = plans.find((p) => String(p.id) === String(planId));

    if (targetPlan && onPlanSelect) {
      onPlanSelect(targetPlan);
    } else {
      const eventDateStr = info.event.startStr.split("T")[0];
      if (onDateSelect) onDateSelect(eventDateStr);
    }
  };

  const formattedPlanEvents = plans.map((plan) => {
    const startDate = plan.dateRange?.startDate || plan.date;
    let endDate = plan.dateRange?.endDate || startDate;

    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      endDate = end.toISOString().split("T")[0];
    }

    return {
      id: String(plan.id),
      title: plan.title,
      start: startDate,
      end: endDate,
      allDay: true,
      backgroundColor: "#3b82f6",
      borderColor: "#3b82f6",
      extendedProps: {
        location: plan.location,
        todos: plan.todos,
      },
    };
  });

  // ── 祝日や季節イベントを排除し、純粋なプランイベントのみにする ──
  const allEvents = [...events, ...formattedPlanEvents];

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 shadow-lg border border-white/60 calendar-card-container flex flex-col">
      <div className="flex-1 w-full h-full [&_.fc]:h-full [&_.fc-view-harness]:h-[calc(100%-40px)]">
        <FullCalendarInner
          allEvents={allEvents}
          dateRange={dateRange}
          handleDateClick={handleDateClick}
          handleEventClick={handleEventClick}
        />
      </div>
    </div>
  );
}
