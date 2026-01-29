"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarDays, Trophy } from "lucide-react";
import type { CalendarData, CalendarEvent, CalendarMatch } from "@/lib/data";

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
  const [viewYear, setViewYear] = useState(calendarData.year);
  const [viewMonth, setViewMonth] = useState(calendarData.month);
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

    setViewMonth(newMonth);
    setViewYear(newYear);

    // Update URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.set("year", newYear.toString());
    url.searchParams.set("month", newMonth.toString());
    window.history.pushState({}, "", url.toString());
  };

  const jumpToToday = () => {
    setViewYear(currentYear);
    setViewMonth(currentMonth);

    const url = new URL(window.location.href);
    url.searchParams.set("year", currentYear.toString());
    url.searchParams.set("month", currentMonth.toString());
    window.history.pushState({}, "", url.toString());
  };

  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date();
    const date = new Date(dateStr);
    return (
      today.getFullYear() === date.getFullYear() &&
      today.getMonth() === date.getMonth() &&
      today.getDate() === date.getDate()
    );
  };

  const isPastDay = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date < today;
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
          <h1 className="text-3xl font-bold text-[var(--ink)] mb-4">Calendario</h1>

          {/* Navigation */}
          <div className="flex items-center justify-between">
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

            {/* Filter toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-[var(--muted)]">Filtrar:</span>
              <button
                onClick={() => {
                  setShowOnlyEvents(false);
                  setShowOnlyMatches(false);
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  !showOnlyEvents && !showOnlyMatches
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Todo
              </button>
              <button
                onClick={() => {
                  setShowOnlyEvents(!showOnlyEvents);
                  setShowOnlyMatches(false);
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  showOnlyEvents
                    ? "bg-green-100 text-green-700"
                    : "bg-[var(--card-solid)] text-[var(--ink)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                Eventos
              </button>
              <button
                onClick={() => {
                  setShowOnlyEvents(false);
                  setShowOnlyMatches(!showOnlyMatches);
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  showOnlyMatches
                    ? "bg-blue-100 text-blue-700"
                    : "bg-[var(--card-solid)] text-[var(--ink)] hover:bg-[var(--bg-hover)]"
                }`}
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
                className="py-3 text-center text-sm font-medium text-[var(--muted)]"
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
                return <div key={`empty-${index}`} className="h-24 border-r border-b bg-[var(--bg-hover)]" />;
              }

              const dayNum = new Date(dayData.date).getDate();
              const isTodayCell = isToday(dayData.date);
              const isPast = isPastDay(dayData.date);
              const events = getFilteredEventsForDay(dayData.date);
              const matches = getFilteredMatchesForDay(dayData.date);
              const hasActivity = events.length > 0 || matches.length > 0;

              return (
                <button
                  key={dayData.date}
                  onClick={() => setSelectedDay(dayData.date)}
                  className={`
                    h-24 border-r border-b p-2 text-left transition-colors border-[color:var(--card-border)]
                    ${isTodayCell ? "bg-[var(--accent)]/10 ring-2 ring-inset ring-[var(--accent)]" : "hover:bg-[var(--bg-hover)]"}
                    ${isPast ? "text-[var(--muted)]" : "text-[var(--ink)]"}
                  `}
                  disabled={!hasActivity}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${isTodayCell ? "text-[var(--accent)]" : ""}`}>
                      {dayNum}
                    </span>
                    {hasActivity && (
                      <CalendarIcon className="w-3 h-3 text-[var(--muted)]" />
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    {events.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={`flex items-center space-x-1 text-xs truncate ${
                          isPast ? "text-[var(--muted)]" : ""
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          event.status === "completed" || event.status === "cancelled"
                            ? "bg-[var(--muted)]"
                            : "bg-green-500"
                        }`} />
                        <span className="truncate">{event.name}</span>
                      </div>
                    ))}
                    {events.length > 2 && (
                      <span className="text-xs text-[var(--muted)]">
                        +{events.length - 2} más
                      </span>
                    )}
                    {matches.slice(0, 2 - events.length).map((match) => (
                      <div
                        key={match.id}
                        className={`flex items-center space-x-1 text-xs truncate ${
                          isPast ? "text-[var(--muted)]" : ""
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          match.score1 !== null && match.score2 !== null
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
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-[var(--card-solid)] rounded-xl shadow-lg max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[var(--bg-hover)] px-6 py-4 border-b border-[color:var(--card-border)] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--ink)]">
                {new Date(selectedDay).toLocaleDateString("es-AR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 hover:bg-[var(--bg-hover)] rounded transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-[var(--muted)]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Events */}
              {selectedDayData.events.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wide mb-3 flex items-center">
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Eventos
                  </h4>
                  <div className="space-y-3">
                    {selectedDayData.events.map((event) => (
                      <div
                        key={event.id}
                        className="bg-[var(--bg-hover)] rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-medium text-[var(--ink)]">{event.name}</h5>
                            <p className="text-sm text-[var(--muted)]">{event.time}</p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              event.status === "open"
                                ? "bg-green-100 text-green-700"
                                : event.status === "locked"
                                ? "bg-yellow-100 text-yellow-700"
                                : event.status === "completed"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-red-100 text-red-700"
                            }`}
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
                        <p className="text-sm text-[var(--ink)]">
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
                  <h4 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wide mb-3 flex items-center">
                    <Trophy className="w-4 h-4 mr-2" />
                    Partidos
                  </h4>
                  <div className="space-y-3">
                    {selectedDayData.matches.map((match) => (
                      <div
                        key={match.id}
                        className="bg-[var(--bg-hover)] rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{match.team1}</span>
                              <span className="text-[var(--muted)]">
                                {match.score1 !== null && match.score2 !== null
                                  ? `${match.score1} - ${match.score2}`
                                  : "Pendiente"}
                              </span>
                              <span className="font-medium">{match.team2}</span>
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/g/${slug}/matches/${match.id}`}
                          className="text-sm text-[var(--accent)] hover:underline"
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
                <p className="text-center text-[var(--muted)] py-8">
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
