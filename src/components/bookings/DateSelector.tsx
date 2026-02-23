"use client";

import { useState } from "react";

interface DateSelectorProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
}

export function DateSelector({ selectedDate, onDateSelect, minDate = new Date() }: DateSelectorProps) {
  const [viewWeekStart, setViewWeekStart] = useState(() => {
    const start = new Date(minDate);
    start.setHours(0, 0, 0, 0);
    return start;
  });

  const getWeekDates = (startDate: Date) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(viewWeekStart);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const goToPreviousWeek = () => {
    const newStart = new Date(viewWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    if (newStart >= minDate) {
      setViewWeekStart(newStart);
    }
  };

  const goToNextWeek = () => {
    const newStart = new Date(viewWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setViewWeekStart(newStart);
  };

  const canGoBack = () => {
    const weekBefore = new Date(viewWeekStart);
    weekBefore.setDate(weekBefore.getDate() - 7);
    return weekBefore >= minDate;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
      <div className="flex items-center justify-between">
        {/* Previous Week Button */}
        <button
          onClick={goToPreviousWeek}
          disabled={!canGoBack()}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">
            chevron_left
          </span>
        </button>

        {/* Date Pills */}
        <div className="flex gap-2">
          {weekDates.map((date) => (
            <button
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              className={`px-4 py-3 rounded-lg font-medium text-sm transition-all min-w-[80px] ${
                isSelected(date)
                  ? "bg-primary text-background-dark shadow-lg scale-105"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs uppercase tracking-wide">
                  {date.toLocaleDateString("es-ES", { weekday: "short" })}
                </span>
                <span className="text-lg font-bold">{date.getDate()}</span>
                {isToday(date) && (
                  <span className="text-[10px] uppercase font-bold">Hoy</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Next Week Button */}
        <button
          onClick={goToNextWeek}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">
            chevron_right
          </span>
        </button>
      </div>
    </div>
  );
}
