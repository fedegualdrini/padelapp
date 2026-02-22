"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { 
  updateAttendance, 
  createWeeklyEvent, 
  generateOccurrences, 
  AttendanceStatus,
  markOccurrenceCompleted,
  linkMatchToOccurrence,
  getLinkableMatches
} from "./actions";
import { getConfirmedPlayersWithElo, balanceTeams, type SuggestedTeams } from "./actions";
import TeamSuggestionModal from "./TeamSuggestionModal";
import DeleteEventButton from "./DeleteEventButton";
import { Spinner } from "@/components/Spinner";

type WeeklyEvent = {
  id: string;
  group_id: string;
  name: string;
  weekday: number;
  start_time: string;
  capacity: number;
  cutoff_weekday: number;
  cutoff_time: string;
  is_active: boolean;
  active_occurrence_id: string | null;
  created_at: string;
  updated_at: string;
};

type EventOccurrence = {
  id: string;
  weekly_event_id: string;
  group_id: string;
  starts_at: string;
  status: 'open' | 'locked' | 'cancelled' | 'completed';
  loaded_match_id: string | null;
  created_at: string;
  updated_at: string;
};

type AttendanceRecord = {
  id: string;
  occurrence_id: string;
  group_id: string;
  player_id: string;
  status: 'confirmed' | 'declined' | 'maybe' | 'waitlist';
  source: 'whatsapp' | 'web' | 'admin';
  created_at: string;
  updated_at: string;
  players?: { id: string; name: string } | null;
};

type AttendanceSummary = {
  occurrence: EventOccurrence;
  weeklyEvent: WeeklyEvent;
  attendance: AttendanceRecord[];
  confirmedCount: number;
  declinedCount: number;
  maybeCount: number;
  waitlistCount: number;
  isFull: boolean;
  spotsAvailable: number;
};

type Player = {
  id: string;
  name: string;
  status: string;
};

type EventsClientProps = {
  slug: string;
  groupId: string;
  weeklyEvents: WeeklyEvent[];
  upcomingSummaries: AttendanceSummary[];
  pastSummaries: AttendanceSummary[];
  players: Player[];
};

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const STATUS_LABELS: Record<AttendanceStatus, { label: string; bgColor: string; textColor: string }> = {
  confirmed: { label: 'Confirmado', bgColor: 'var(--status-success-bg)', textColor: 'var(--status-success-text-muted)' },
  declined: { label: 'No va', bgColor: 'var(--status-error-bg)', textColor: 'var(--status-error-text-muted)' },
  maybe: { label: 'Tal vez', bgColor: 'var(--status-warning-bg)', textColor: 'var(--status-warning-text-muted)' },
  waitlist: { label: 'Lista de espera', bgColor: 'var(--status-neutral-bg)', textColor: 'var(--status-neutral-text-muted)' },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EventsClient({
  slug,
  weeklyEvents,
  upcomingSummaries,
  pastSummaries,
  players,
}: EventsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(searchParams.get('create') === 'true');
  const [showPastEvents, setShowPastEvents] = useState(false);
  
  // Modal state
  const [modalState, setModalState] = useState<{
    show: boolean;
    occurrenceId: string;
    teams: SuggestedTeams | null;
  }>({
    show: false,
    occurrenceId: "",
    teams: null,
  });

  async function handleAttendance(occurrenceId: string, playerId: string, status: AttendanceStatus) {
    setLoading(`${occurrenceId}-${playerId}`);
    setError(null);
    try {
      await updateAttendance(slug, occurrenceId, playerId, status);
      // Show success toast based on status
      const messages: Record<AttendanceStatus, string> = {
        confirmed: "Asistencia confirmada",
        declined: "Asistencia cancelada",
        maybe: "Marcado como tal vez",
        waitlist: "Agregado a lista de espera",
      };
      toast.success(messages[status]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar asistencia';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(null);
    }
  }

  async function handleCreateEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading('create');
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      weekday: parseInt(formData.get('weekday') as string, 10),
      startTime: formData.get('startTime') as string,
      capacity: parseInt(formData.get('capacity') as string, 10),
      cutoffWeekday: parseInt(formData.get('cutoffWeekday') as string, 10),
      cutoffTime: formData.get('cutoffTime') as string,
    };

    try {
      await createWeeklyEvent(slug, data);
      setShowCreateForm(false);
      toast.success("Evento creado correctamente");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear evento';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(null);
    }
  }

  async function handleGenerateOccurrences(weeklyEventId: string) {
    setLoading(`generate-${weeklyEventId}`);
    setError(null);
    try {
      await generateOccurrences(slug, weeklyEventId, 4);
      toast.success("Fechas generadas correctamente");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al generar fechas';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(null);
    }
  }

  async function handleCreateMatch(occurrenceId: string) {
    setLoading(`match-${occurrenceId}`);
    setError(null);
    try {
      const playersWithElo = await getConfirmedPlayersWithElo(occurrenceId);
      if (playersWithElo.length !== 4) {
        throw new Error("Se necesitan 4 jugadores confirmados");
      }
      const teams = await balanceTeams(playersWithElo);
      setModalState({
        show: true,
        occurrenceId,
        teams,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener jugadores';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(null);
    }
  }

  function handleCloseModal() {
    setModalState({
      show: false,
      occurrenceId: "",
      teams: null,
    });
  }

  function handleMatchCreated(matchId: string) {
    setModalState({
      show: false,
      occurrenceId: "",
      teams: null,
    });
    router.push(`/g/${slug}/matches/${matchId}`);
  }

  const playerMap = new Map(players.map(p => [p.id, p]));

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-[var(--ink)]">Eventos</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Gestiona la asistencia a los partidos semanales
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(13,107,95,0.25)] transition hover:-translate-y-0.5"
        >
          {showCreateForm ? 'Cancelar' : 'Nuevo evento'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-[color:var(--status-error-border)] bg-[color:var(--status-error-bg)] p-4 text-sm text-[color:var(--status-error-text)]">
          {error}
        </div>
      )}

      {/* Create event form */}
      {showCreateForm && (
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <h3 className="mb-4 font-display text-lg text-[var(--ink)]">Crear evento semanal</h3>
          <form onSubmit={handleCreateEvent} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">Nombre</label>
                <input
                  name="name"
                  type="text"
                  defaultValue="Jueves 20:00"
                  required
                  className="w-full rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">Día de la semana</label>
                <select
                  name="weekday"
                  defaultValue="4"
                  required
                  className="w-full rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  {WEEKDAYS.map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">Hora</label>
                <input
                  name="startTime"
                  type="time"
                  defaultValue="20:00"
                  required
                  className="w-full rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">Capacidad</label>
                <input
                  name="capacity"
                  type="number"
                  min="2"
                  max="20"
                  defaultValue="4"
                  required
                  className="w-full rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">Cierre inscripción (día)</label>
                <select
                  name="cutoffWeekday"
                  defaultValue="2"
                  required
                  className="w-full rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  {WEEKDAYS.map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">Cierre inscripción (hora)</label>
                <input
                  name="cutoffTime"
                  type="time"
                  defaultValue="14:00"
                  required
                  className="w-full rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading === 'create'}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading === 'create' && <Spinner size="sm" />}
                {loading === 'create' ? 'Creando...' : 'Crear evento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Weekly Events Configuration */}
      {weeklyEvents.length > 0 && (
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <h3 className="mb-4 font-display text-lg text-[var(--ink)]">Eventos configurados</h3>
          <div className="flex flex-col gap-3">
            {weeklyEvents.map(event => (
              <div key={event.id} className="flex items-center justify-between rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
                <div>
                  <p className="font-semibold text-[var(--ink)]">{event.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {WEEKDAYS[event.weekday]} {event.start_time.slice(0, 5)} • Capacidad: {event.capacity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGenerateOccurrences(event.id)}
                    disabled={loading === `generate-${event.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--accent)] px-4 py-1.5 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white disabled:opacity-50"
                  >
                    {loading === `generate-${event.id}` && <Spinner size="sm" />}
                    {loading === `generate-${event.id}` ? 'Generando...' : 'Generar fechas'}
                  </button>
                  <DeleteEventButton
                    slug={slug}
                    eventId={event.id}
                    eventName={event.name}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Occurrences */}
      <div>
        <h3 className="mb-4 font-display text-xl text-[var(--ink)]">Próximos eventos</h3>
        {upcomingSummaries.length === 0 ? (
          <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
            <p className="text-[var(--muted)]">No hay eventos próximos</p>
            {weeklyEvents.length > 0 && (
              <p className="mt-2 text-sm text-[var(--muted)]">
                Genera fechas usando el botón &quot;Generar fechas&quot; arriba
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingSummaries.map(summary => (
              <OccurrenceCard
                key={summary.occurrence.id}
                summary={summary}
                players={players}
                playerMap={playerMap}
                loading={loading}
                onAttendance={handleAttendance}
                onCreateMatch={handleCreateMatch}
                slug={slug}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past Occurrences */}
      {pastSummaries.length > 0 && (
        <div>
          <button
            onClick={() => setShowPastEvents(!showPastEvents)}
            className="mb-4 flex items-center gap-2 font-display text-xl text-[var(--ink)] hover:text-[var(--accent)]"
          >
            <span>Eventos pasados</span>
            <span className="text-sm">{showPastEvents ? '▲' : '▼'}</span>
          </button>
          {showPastEvents && (
            <div className="grid gap-4 md:grid-cols-2">
              {pastSummaries.map(summary => (
                <OccurrenceCard
                  key={summary.occurrence.id}
                  summary={summary}
                  players={players}
                  playerMap={playerMap}
                  loading={loading}
                  onAttendance={handleAttendance}
                  isPast
                  slug={slug}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Team Suggestion Modal */}
      {modalState.show && modalState.teams && (
        <TeamSuggestionModal
          occurrenceId={modalState.occurrenceId}
          slug={slug}
          initialTeams={modalState.teams}
          onClose={handleCloseModal}
          onSuccess={handleMatchCreated}
          onError={setError}
          createdBy={players[0]?.id ?? ""}
        />
      )}
    </div>
  );
}

interface OccurrenceCardProps {
  summary: AttendanceSummary;
  players: Player[];
  playerMap: Map<string, Player>;
  loading: string | null;
  onAttendance: (occurrenceId: string, playerId: string, status: AttendanceStatus) => void;
  onCreateMatch?: (occurrenceId: string) => void;
  isPast?: boolean;
  slug: string;
}

function OccurrenceCard({ summary, players, playerMap, loading, onAttendance, onCreateMatch, isPast, slug }: OccurrenceCardProps) {
  const isCancelled = summary.occurrence.status === 'cancelled';
  const [selectedPlayer, setSelectedPlayer] = useState<string>(players[0]?.id ?? '');

  const confirmedPlayers = summary.attendance.filter(a => a.status === 'confirmed');
  const maybePlayers = summary.attendance.filter(a => a.status === 'maybe');
  const waitlistPlayers = summary.attendance.filter(a => a.status === 'waitlist');

  const currentPlayerStatus = summary.attendance.find(a => a.player_id === selectedPlayer)?.status;

  return (
    <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="font-display text-lg text-[var(--ink)]">
            {summary.weeklyEvent.name}
          </p>
          <p className="text-sm text-[var(--muted)]">
            {formatDate(summary.occurrence.starts_at)}
          </p>
        </div>
        <div className="text-right">
          {isCancelled ? (
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" style={{
              backgroundColor: 'var(--status-warning-bg)',
              color: 'var(--status-warning-text)'
            }}>
              No se jugó
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" style={{
              backgroundColor: summary.isFull ? 'var(--status-error-bg)' : summary.spotsAvailable <= 2 ? 'var(--status-warning-bg)' : 'var(--status-success-bg)',
              color: summary.isFull ? 'var(--status-error-text)' : summary.spotsAvailable <= 2 ? 'var(--status-warning-text)' : 'var(--status-success-text)'
            }}>
              {summary.isFull ? 'Completo' : `${summary.spotsAvailable} lugares`}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2 text-center">
        <div className="rounded-lg p-2 sm:p-2 min-h-[52px] flex flex-col justify-center" style={{ backgroundColor: 'var(--status-success-bg)' }}>
          <p className="text-lg sm:text-lg font-bold" style={{ color: 'var(--status-success-text)' }}>{summary.confirmedCount}</p>
          <p className="text-xs sm:text-xs" style={{ color: 'var(--status-success-text-muted)' }}>Van</p>
        </div>
        <div className="rounded-lg p-2 sm:p-2 min-h-[52px] flex flex-col justify-center" style={{ backgroundColor: 'var(--status-error-bg)' }}>
          <p className="text-lg sm:text-lg font-bold" style={{ color: 'var(--status-error-text)' }}>{summary.declinedCount}</p>
          <p className="text-xs sm:text-xs" style={{ color: 'var(--status-error-text-muted)' }}>No van</p>
        </div>
        <div className="rounded-lg p-2 sm:p-2 min-h-[52px] flex flex-col justify-center" style={{ backgroundColor: 'var(--status-warning-bg)' }}>
          <p className="text-lg sm:text-lg font-bold" style={{ color: 'var(--status-warning-text)' }}>{summary.maybeCount}</p>
          <p className="text-xs sm:text-xs" style={{ color: 'var(--status-warning-text-muted)' }}>Tal vez</p>
        </div>
        <div className="rounded-lg p-2 sm:p-2 min-h-[52px] flex flex-col justify-center" style={{ backgroundColor: 'var(--status-neutral-bg)' }}>
          <p className="text-lg sm:text-lg font-bold" style={{ color: 'var(--status-neutral-text)' }}>{summary.waitlistCount}</p>
          <p className="text-xs sm:text-xs" style={{ color: 'var(--status-neutral-text-muted)' }}>Espera</p>
        </div>
      </div>

      {/* Attendance lists */}
      {confirmedPlayers.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--status-success-text-muted)' }}>Confirmados</p>
          <div className="flex flex-wrap gap-1">
            {confirmedPlayers.map(a => (
              <span key={a.id} className="rounded-full px-2 py-1 text-xs" style={{
                backgroundColor: 'var(--status-success-bg)',
                color: 'var(--status-success-text)'
              }}>
                {a.players?.name ?? playerMap.get(a.player_id)?.name ?? 'Desconocido'}
              </span>
            ))}
          </div>
        </div>
      )}

      {maybePlayers.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--status-warning-text-muted)' }}>Tal vez</p>
          <div className="flex flex-wrap gap-1">
            {maybePlayers.map(a => (
              <span key={a.id} className="rounded-full px-2 py-1 text-xs" style={{
                backgroundColor: 'var(--status-warning-bg)',
                color: 'var(--status-warning-text)'
              }}>
                {a.players?.name ?? playerMap.get(a.player_id)?.name ?? 'Desconocido'}
              </span>
            ))}
          </div>
        </div>
      )}

      {waitlistPlayers.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--status-neutral-text-muted)' }}>Lista de espera</p>
          <div className="flex flex-wrap gap-1">
            {waitlistPlayers.map(a => (
              <span key={a.id} className="rounded-full px-2 py-1 text-xs" style={{
                backgroundColor: 'var(--status-neutral-bg)',
                color: 'var(--status-neutral-text)'
              }}>
                {a.players?.name ?? playerMap.get(a.player_id)?.name ?? 'Desconocido'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!isPast && !isCancelled && (
        <div className="mt-4 border-t border-[color:var(--card-border)] pt-4">
          <div className="mb-3">
            <label className="mb-1 block text-sm text-[var(--muted)]">Jugador</label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-h-[44px]"
            >
              {players.filter(p => p.status === 'usual' || p.status === 'invite').map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
          </div>

          {currentPlayerStatus && (
            <p className="mb-2 text-sm text-[var(--muted)]">
              Tu estado: <span className="px-2 py-0.5 rounded-full" style={{
                backgroundColor: STATUS_LABELS[currentPlayerStatus].bgColor,
                color: STATUS_LABELS[currentPlayerStatus].textColor
              }}>
                {STATUS_LABELS[currentPlayerStatus].label}
              </span>
            </p>
          )}

          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              onClick={() => onAttendance(summary.occurrence.id, selectedPlayer, 'confirmed')}
              disabled={loading === `${summary.occurrence.id}-${selectedPlayer}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition disabled:opacity-50 min-h-[44px]"
              style={{
                backgroundColor: currentPlayerStatus === 'confirmed' ? 'var(--status-success-strong)' : 'var(--status-success-bg)',
                color: currentPlayerStatus === 'confirmed' ? 'var(--status-success-strong-text)' : 'var(--status-success-text)'
              }}
            >
              {loading === `${summary.occurrence.id}-${selectedPlayer}` && <Spinner size="sm" />}
              Voy
            </button>
            <button
              onClick={() => onAttendance(summary.occurrence.id, selectedPlayer, 'maybe')}
              disabled={loading === `${summary.occurrence.id}-${selectedPlayer}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition disabled:opacity-50 min-h-[44px]"
              style={{
                backgroundColor: currentPlayerStatus === 'maybe' ? 'var(--status-warning-strong)' : 'var(--status-warning-bg)',
                color: currentPlayerStatus === 'maybe' ? 'var(--status-warning-strong-text)' : 'var(--status-warning-text)'
              }}
            >
              {loading === `${summary.occurrence.id}-${selectedPlayer}` && <Spinner size="sm" />}
              Tal vez
            </button>
            <button
              onClick={() => onAttendance(summary.occurrence.id, selectedPlayer, 'declined')}
              disabled={loading === `${summary.occurrence.id}-${selectedPlayer}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition disabled:opacity-50 min-h-[44px]"
              style={{
                backgroundColor: currentPlayerStatus === 'declined' ? 'var(--status-error-strong)' : 'var(--status-error-bg)',
                color: currentPlayerStatus === 'declined' ? 'var(--status-error-strong-text)' : 'var(--status-error-text)'
              }}
            >
              {loading === `${summary.occurrence.id}-${selectedPlayer}` && <Spinner size="sm" />}
              No voy
            </button>
          </div>

          {/* Create match button */}
          {summary.confirmedCount >= 4 && !summary.occurrence.loaded_match_id && onCreateMatch && (
            <button
              onClick={() => onCreateMatch(summary.occurrence.id)}
              disabled={loading === `match-${summary.occurrence.id}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(13,107,95,0.25)] transition hover:-translate-y-0.5 disabled:opacity-50 min-h-[44px]"
            >
              {loading === `match-${summary.occurrence.id}` && <Spinner size="sm" />}
              {loading === `match-${summary.occurrence.id}` ? 'Cargando...' : 'Crear partido'}
            </button>
          )}
          
          {summary.occurrence.loaded_match_id && (
            <a
              href={`/g/${slug}/matches/${summary.occurrence.loaded_match_id}`}
              className="block w-full rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-2.5 text-center text-sm font-medium text-[var(--ink)] transition hover:border-[var(--accent)] min-h-[44px] flex items-center justify-center"
            >
              Ver partido creado
            </a>
          )}
        </div>
      )}

      {/* Past event actions */}
      {isPast && !isCancelled && (
        <div className="mt-4 border-t border-[color:var(--card-border)] pt-4">
          {summary.occurrence.loaded_match_id ? (
            <a
              href={`/g/${slug}/matches/${summary.occurrence.loaded_match_id}`}
              className="block w-full rounded-lg border border-[color:var(--status-success-border)] bg-[color:var(--status-success-bg)] px-4 py-2.5 text-center text-sm font-medium text-[var(--status-success-text)] transition hover:border-[var(--accent)] min-h-[44px] flex items-center justify-center"
            >
              ✓ Ver partido vinculado
            </a>
          ) : summary.occurrence.status === 'completed' ? (
            <div className="rounded-lg bg-[color:var(--status-success-bg)] px-4 py-2.5 text-center text-sm font-medium text-[var(--status-success-text)] min-h-[44px] flex items-center justify-center">
              ✓ Marcado como jugado
            </div>
          ) : (
            <PastEventActions 
              slug={slug} 
              occurrenceId={summary.occurrence.id}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Component for past event actions (link match or mark completed)
function PastEventActions({ 
  slug, 
  occurrenceId 
}: { 
  slug: string; 
  occurrenceId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkableMatches, setLinkableMatches] = useState<Array<{ id: string; team1: string; team2: string; score: string }>>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMarkCompleted = () => {
    startTransition(async () => {
      try {
        setError(null);
        await markOccurrenceCompleted(slug, occurrenceId);
        toast.success("Evento marcado como jugado");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al marcar como jugado";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  const handleOpenLinkModal = async () => {
    setError(null);
    try {
      const matches = await getLinkableMatches(slug, occurrenceId);
      setLinkableMatches(matches);
      setShowLinkModal(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al buscar partidos";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleLinkMatch = () => {
    if (!selectedMatchId) return;
    
    startTransition(async () => {
      try {
        setError(null);
        await linkMatchToOccurrence(slug, occurrenceId, selectedMatchId);
        setShowLinkModal(false);
        toast.success("Partido vinculado correctamente");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al vincular partido";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          onClick={handleOpenLinkModal}
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(13,107,95,0.25)] transition hover:-translate-y-0.5 disabled:opacity-50 min-h-[44px]"
        >
          {isPending && <Spinner size="sm" />}
          Vincular partido
        </button>
        <button
          onClick={handleMarkCompleted}
          disabled={isPending}
          className="w-full rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--accent)] disabled:opacity-50 min-h-[44px]"
        >
          Marcar como jugado
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-[var(--status-error-text)]">{error}</p>
      )}

      {/* Link match modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)] backdrop-blur">
            <h3 className="font-display text-xl text-[var(--ink)]">
              Vincular partido
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Selecciona un partido jugado ese mismo día para vincularlo al evento.
            </p>

            {linkableMatches.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted)]">
                No hay partidos registrados ese día. Puedes crear uno nuevo o marcar el evento como jugado manualmente.
              </p>
            ) : (
              <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                {linkableMatches.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => setSelectedMatchId(match.id)}
                    className={`w-full text-left rounded-xl border p-3 transition ${
                      selectedMatchId === match.id 
                        ? 'border-[var(--accent)] bg-[color:var(--status-success-bg)]' 
                        : 'border-[color:var(--card-border)] bg-[color:var(--card-solid)]'
                    }`}
                  >
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {match.team1} vs {match.team2}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {match.score}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                disabled={isPending}
                className="rounded-full border border-[color:var(--card-border)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] disabled:opacity-50 min-h-[44px]"
              >
                Cancelar
              </button>
              {linkableMatches.length > 0 && (
                <button
                  type="button"
                  onClick={handleLinkMatch}
                  disabled={isPending || !selectedMatchId}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 min-h-[44px]"
                >
                  {isPending && <Spinner size="sm" />}
                  {isPending ? "Vinculando..." : "Vincular"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
