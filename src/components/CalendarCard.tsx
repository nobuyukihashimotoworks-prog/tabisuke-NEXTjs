"use client";

import { Plan } from "@/types/plan";
import React from "react";
import dynamic from "next/dynamic";
import holidayJp from "@holiday-jp/holiday_jp"; // ★ 元に戻す
import { SEASONAL_EVENTS } from "../utils/seasonalEvents"; // ★ 元に戻す

const FullCalendarInner = dynamic(() => import("./FullCalendarInner"), {
  ssr: false,
});

interface CalendarCardProps {
  onDateSelect?: (dateStr: string) => void;
  onPlanSelect?: (plan: Plan) => void;
  dateRange?: { startDate: string | null; endDate: string | null };
  selectedDate?: string; // ★ 追加: 現在選択中の日付
  plans?: Plan[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events?: any[];
}

export default function CalendarCard({
  onDateSelect,
  onPlanSelect,
  dateRange = { startDate: null, endDate: null },
  selectedDate, // ★ 追加
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

  // ★ holiday-jp や季節イベントの生成ロジックを復活（日付の数式を修正）
  const currentYear = new Date().getFullYear();
  const holidays = holidayJp.between(
    new Date(`${currentYear - 1}-01-01`),
    new Date(`${currentYear + 2}-12-31`),
  );

  const holidayEvents = holidays.map((h) => {
    const dateStr = h.date.toISOString().split("T")[0];
    return {
      title: h.name,
      start: dateStr,
      allDay: true,
      display: "auto",
      classNames: ["holiday-event-label"],
      backgroundColor: "transparent",
      borderColor: "transparent",
      editable: false,
      extendedProps: { isHoliday: true },
    };
  });

  const seasonalEventsList = Object.entries(SEASONAL_EVENTS).map(
    ([dateStr, title]) => ({
      title,
      start: dateStr,
      allDay: true,
      display: "auto",
      classNames: ["seasonal-event-label"],
      backgroundColor: "#f3e8ff",
      borderColor: "#e9d5ff",
      editable: false,
      extendedProps: { isSeasonal: true },
    }),
  );

  // すべてのイベントを結合
  const allEvents = [
    ...events,
    ...holidayEvents,
    ...seasonalEventsList,
    ...formattedPlanEvents,
  ];

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 shadow-lg border border-white/60 calendar-card-container flex flex-col">
      <div className="flex-1 w-full h-full [&_.fc]:h-full [&_.fc-view-harness]:h-[calc(100%-40px)]">
        <FullCalendarInner
          allEvents={allEvents}
          dateRange={dateRange}
          selectedDate={dateRange.startDate ?? undefined}
          startDate={dateRange.startDate ?? undefined}
          endDate={dateRange.endDate ?? undefined}
          handleDateClick={handleDateClick}
          handleEventClick={handleEventClick}
        />
      </div>
    </div>
  );
}
