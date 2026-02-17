"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarDays, Trophy } from "lucide-react";
import type { CalendarData } from "@/lib/data";

type CalendarClientProps = {
  slug: string;
  groupId: string;
  calendarData: CalendarData;
  currentYear: number;
  currentMonth: number;
};

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function CalendarClient({
  slug,
  groupId,
  calendarData,
  currentYear,
  currentMonth,
}: CalendarClientProps) {
  const router = useRouter();

  // The calendar grid is driven by Server Component data (calendarData).
  // Keep the header in sync with it to avoid stale UI on navigation.
  const viewYear = calendarData.year;
  const viewMonth = calendarData.month;

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showOnlyEvents, setShowOnlyEvents] = useState(false);
  const [showOnlyMatches, setShowOnlyMatches] = useState(false);

  const navigateMonth = (direction: number) => {
    let newMonth = viewMonth + direction;
    let newYear = viewYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }

    // Update the URL via Next.js router so the Server Component refetches data.
    const url = new URL(window.location.href);
    url.searchParams.set("year", newYear.toString());
    url.searchParams.set("month", newMonth.toString());
    router.push(url.pathname + url.search);
  };

  const jumpToToday = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("year", currentYear.toString());
    url.searchParams.set("month", currentMonth.toString());
    router.push(url.pathname + url.search);
  };

  // Treat YYYY-MM-DD as a *calendar date* (not a timestamp).
  // Never use `new Date('YYYY-MM-DD')` here: it's parsed as UTC and then displayed
  // in local time, which can shift the day/weekday in negative-offset timezones.
  const todayKeyUtc = new Date().toISOString().slice(0, 10);

  const parseDateKeyUtc = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map((v) => Number(v));
    return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  };

  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    return dateStr === todayKeyUtc;
  };

  const isPastDay = (dateStr: string) => {
    if (!dateStr) return false;
    // Compare as YYYY-MM-DD strings (lexicographic order matches date order).
    return dateStr < todayKeyUtc;
  };

  const getFilteredEventsForDay = (dateStr: string) => {
    const dayData = calendarData.days.find(d => d.date === dateStr);
    if (!dayData) return [];

    if (showOnlyMatches) return [];
    return dayData.events;
  };

  const getFilteredMatchesForDay = (dateStr: string) => {
    const dayData = calendarData.days.find(d => d.date === dateStr);
    if (!dayData) return [];

    if (showOnlyEvents) return [];
    return dayData.matches;
  };

  const hasEventsOrMatches = (dateStr: string) => {
    const dayData = calendarData.days.find(d => d.date === dateStr);
    if (!dayData) return false;
    if (showOnlyEvents) return dayData.events.length > 0;
    if (showOnlyMatches) return dayData.matches.length > 0;
    return dayData.events.length > 0 || dayData.matches.length > 0;
  };

  // Find selected day data
  const selectedDayData = selectedDay
    ? calendarData.days.find(d => d.date === selectedDay)
    : null;

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <div className="bg-[var(--card-solid)] border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h2 className="font-display text-2xl text-[var(--ink)] mb-4">Calendario</h2>

          {/* Navigation */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="w-5 h-5 text-[var(--muted)]" />
                </button>
                <button
                  onClick={jumpToToday}
                  className="px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-colors"
                >
                  Hoy
                </button>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="w-5 h-5 text-[var(--muted)]" />
                </button>
                <h2 className="ml-4 text-xl font-semibold text-[var(--ink)]">
                  {MONTHS[viewMonth]} {viewYear}
                </h2>
              </div>
            </div>

            {/* Filter toggle */}
            <div className="flex items-center space-x-2 overflow-x-auto">
              <span className="text-sm text-[var(--muted)] whitespace-nowrap">Filtrar:</span>
              <button
                onClick={() => {
                  setShowOnlyEvents(false);
                  setShowOnlyMatches(false);
                }}
                className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors shrink-0"
                style={{
                  backgroundColor: !showOnlyEvents && !showOnlyMatches ? 'var(--status-info-bg)' : 'var(--status-neutral-bg)',
                  color: !showOnlyEvents && !showOnlyMatches ? 'var(--status-info-text)' : 'var(--status-neutral-text-muted)'
                }}
              >
                Todo
              </button>
              <button
                onClick={() => {
                  setShowOnlyEvents(!showOnlyEvents);
                  setShowOnlyMatches(false);
                }}
                className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors shrink-0"
                style={{
                  backgroundColor: showOnlyEvents ? 'var(--status-success-bg)' : 'var(--card-solid)',
                  color: showOnlyEvents ? 'var(--status-success-text)' : 'var(--ink)'
                }}
              >
                Eventos
              </button>
              <button
                onClick={() => {
                  setShowOnlyEvents(false);
                  setShowOnlyMatches(!showOnlyMatches);
                }}
                className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors shrink-0"
                style={{
                  backgroundColor: showOnlyMatches ? 'var(--status-info-bg)' : 'var(--card-solid)',
                  color: showOnlyMatches ? 'var(--status-info-text)' : 'var(--ink)'
                }}
              >
                Partidos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-[var(--card-solid)] rounded-lg shadow-sm border border-[color:var(--card-border)] overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b bg-[var(--bg-hover)]">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs sm:text-sm font-medium text-[var(--muted)]"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {calendarData.days.map((dayData, index) => {
              if (!dayData.date) {
                // Empty cell for padding
                return <div key={`empty-${index}`} className="h-16 sm:h-24 border-r border-b bg-[var(--bg-hover)]" />;
              }

              const dayNum = parseDateKeyUtc(dayData.date).getUTCDate();
              const isTodayCell = isToday(dayData.date);
              const isPast = isPastDay(dayData.date);
              const events = getFilteredEventsForDay(dayData.date);
              const matches = getFilteredMatchesForDay(dayData.date);
              const hasActivity = events.length > 0 || matches.length > 0;

              return (
                <button
                  key={dayData.date}
                  data-testid={`calendar-day-${dayData.date}`}
                  aria-label={`Día ${dayNum} (${dayData.date})`}
                  onClick={() => setSelectedDay(dayData.date)}
                  className={`
                    h-16 sm:h-24 border-r border-b p-1 sm:p-2 text-left transition-colors border-[color:var(--card-border)]
                    ${isTodayCell ? "bg-[var(--accent)]/10 ring-1 sm:ring-2 ring-inset ring-[var(--accent)]" : "hover:bg-[var(--bg-hover)]"}
                    ${isPast ? "text-[var(--muted)]" : "text-[var(--ink)]"}
                  `}
                  disabled={!hasActivity}
                >
                  <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                    <span className={`text-xs sm:text-sm font-medium ${isTodayCell ? "text-[var(--accent)]" : ""}`}>
                      {dayNum}
                    </span>
                    {hasActivity && (
                      <CalendarIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[var(--muted)]" />
                    )}
                  </div>

                  <div className="space-y-0.5 sm:space-y-1 overflow-hidden">
                    {events.slice(0, 1).map((event) => (
                      <div
                        key={event.id}
                        className={`flex items-center space-x-0.5 text-[10px] sm:text-xs truncate ${
                          isPast ? "text-[var(--muted)]" : ""
                        }`}
                      >
                        <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0 ${
                          event.status === "completed" || event.status === "cancelled"
                            ? "bg-[var(--muted)]"
                            : "bg-green-500"
                        }`} />
                        <span className="truncate">{event.name}</span>
                      </div>
                    ))}
                    {events.length > 1 && (
                      <span className="text-[10px] sm:text-xs text-[var(--muted)]">
                        +{events.length - 1}
                      </span>
                    )}
                    {matches.slice(0, 1 - events.length).map((match) => (
                      <div
                        key={match.id}
                        className={`flex items-center space-x-0.5 text-[10px] sm:text-xs truncate ${
                          isPast ? "text-[var(--muted)]" : ""
                        }`}
                      >
                        <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0 ${
                          match.sets.length > 0
                            ? "bg-[var(--accent)]"
                            : "bg-[var(--muted)]"
                        }`} />
                        <span className="truncate">Partido</span>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Details Modal */}
      {selectedDay && selectedDayData && (
        <div
          data-testid="calendar-day-modal-backdrop"
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-[var(--card-solid)] rounded-t-xl sm:rounded-xl shadow-lg w-full sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[var(--bg-hover)] px-4 sm:px-6 py-4 border-b border-[color:var(--card-border)] flex items-center justify-between shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-[var(--ink)]">
                {parseDateKeyUtc(selectedDay).toLocaleDateString("es-AR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  timeZone: "UTC",
                })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 hover:bg-[var(--bg-hover)] rounded transition-colors"
                aria-label="Cerrar"
              >
                <ChevronRight className="w-5 h-5 text-[var(--muted)]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {/* Events */}
              {selectedDayData.events.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-xs sm:text-sm font-medium text-[var(--muted)] uppercase tracking-wide mb-2 sm:mb-3 flex items-center">
                    <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Eventos
                  </h4>
                  <div className="space-y-2 sm:space-y-3">
                    {selectedDayData.events.map((event) => (
                      <div
                        key={event.id}
                        className="bg-[var(--bg-hover)] rounded-lg p-3 sm:p-4"
                      >
                        <div className="flex items-start justify-between mb-1 sm:mb-2">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-[var(--ink)] text-sm sm:text-base truncate">{event.name}</h5>
                            <p className="text-xs sm:text-sm text-[var(--muted)]">{event.time}</p>
                          </div>
                          <span
                            className="px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full shrink-0 ml-2"
                            style={{
                              backgroundColor:
                                event.status === "open"
                                  ? 'var(--status-success-bg)'
                                  : event.status === "locked"
                                  ? 'var(--status-warning-bg)'
                                  : event.status === "completed"
                                  ? 'var(--status-neutral-bg)'
                                  : 'var(--status-error-bg)',
                              color:
                                event.status === "open"
                                  ? 'var(--status-success-text)'
                                  : event.status === "locked"
                                  ? 'var(--status-warning-text)'
                                  : event.status === "completed"
                                  ? 'var(--status-neutral-text)'
                                  : 'var(--status-error-text)'
                            }}
                          >
                            {event.status === "open"
                              ? "Abierto"
                              : event.status === "locked"
                              ? "Cerrado"
                              : event.status === "completed"
                              ? "Completado"
                              : "Cancelado"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[var(--ink)]">
                          {event.attendanceCount}/{event.capacity} confirmados
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matches */}
              {selectedDayData.matches.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-[var(--muted)] uppercase tracking-wide mb-2 sm:mb-3 flex items-center">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Partidos
                  </h4>
                  <div className="space-y-2 sm:space-y-3">
                    {selectedDayData.matches.map((match) => (
                      <div
                        key={match.id}
                        className="bg-[var(--bg-hover)] rounded-lg p-3 sm:p-4"
                      >
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="font-medium truncate">{match.team1}</span>
                              <span className="text-[var(--muted)] mx-2 shrink-0">
                                {match.sets.length > 0
                                  ? match.sets
                                      .map((s) => `${s.team1}-${s.team2}`)
                                      .join(", ")
                                  : "Pendiente"}
                              </span>
                              <span className="font-medium truncate">{match.team2}</span>
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/g/${slug}/matches/${match.id}`}
                          className="text-xs sm:text-sm text-[var(--accent)] hover:underline block"
                        >
                          Ver detalles
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {selectedDayData.events.length === 0 &&
                selectedDayData.matches.length === 0 && (
                <p className="text-center text-[var(--muted)] py-6 sm:py-8 text-sm sm:text-base">
                  No hay eventos ni partidos para este día
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
