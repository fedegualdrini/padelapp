"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateAttendance,
  type AttendanceStatus,
  getConfirmedPlayersWithElo,
  balanceTeams,
  type SuggestedTeams,
} from "./events/actions";
import TeamSuggestionModal from "./events/TeamSuggestionModal";
import CancelOccurrenceButton from "./events/CancelOccurrenceButton";

type WeeklyEvent = {
  id: string;
  name: string;
  weekday: number;
  start_time: string;
  capacity: number;
};

type EventOccurrence = {
  id: string;
  starts_at: string;
  status: "open" | "locked" | "cancelled" | "completed";
  loaded_match_id: string | null;
};

type AttendanceRecord = {
  id: string;
  occurrence_id: string;
  player_id: string;
  status: "confirmed" | "declined" | "maybe" | "waitlist";
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

type NextMatchCardClientProps = {
  slug: string;
  summary: AttendanceSummary | null;
  players: Player[];
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NextMatchCardClient({ slug, summary, players }: NextMatchCardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ show: boolean; teams: SuggestedTeams | null }>(
    { show: false, teams: null }
  );

  const usualPlayers = useMemo(
    () => players.filter((p) => p.status === "usual"),
    [players]
  );

  const [selectedPlayer, setSelectedPlayer] = useState<string>(usualPlayers[0]?.id ?? "");

  useEffect(() => {
    if (!selectedPlayer && usualPlayers[0]?.id) {
      setSelectedPlayer(usualPlayers[0].id);
    }
  }, [selectedPlayer, usualPlayers]);

  if (!summary) {
    return (
      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[var(--shadow-card)] backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Próximo partido
            </p>
            <h2 className="font-display text-2xl text-[var(--ink)]">No hay fecha cargada</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Configurá el evento semanal y generá fechas desde la agenda.
            </p>
          </div>
          <Link
            href={`/g/${slug}/events?create=true`}
            className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
          >
            Ir a agenda
          </Link>
        </div>
      </section>
    );
  }

  const s = summary;

  const confirmedPlayers = s.attendance.filter((a) => a.status === "confirmed");
  const maybePlayers = s.attendance.filter((a) => a.status === "maybe");
  const declinedPlayers = s.attendance.filter((a) => a.status === "declined");

  const needToReachFour = Math.max(0, 4 - s.confirmedCount);

  const currentStatus = s.attendance.find((a) => a.player_id === selectedPlayer)?.status;

  async function setStatus(status: AttendanceStatus) {
    if (!selectedPlayer) return;
    setError(null);

    startTransition(async () => {
      try {
        await updateAttendance(slug, s.occurrence.id, selectedPlayer, status);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error actualizando asistencia");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[var(--shadow-card)] backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Próximo partido</p>
          <h2 className="font-display text-2xl text-[var(--ink)]">{s.weeklyEvent.name}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{formatDate(s.occurrence.starts_at)}</p>
          {needToReachFour > 0 ? (
            <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
              Faltan {needToReachFour} para llegar a 4.
            </p>
          ) : (
            <p className="mt-2 text-sm font-semibold text-[var(--ink)]">Ya son 4+ confirmados.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/g/${slug}/events`}
            className="rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-solid)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
          >
            Abrir RSVP
          </Link>

          <CancelOccurrenceButton
            slug={slug}
            occurrenceId={s.occurrence.id}
            disabled={Boolean(s.occurrence.loaded_match_id)}
          />

          <button
            type="button"
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  const playersWithElo = await getConfirmedPlayersWithElo(s.occurrence.id);
                  if (playersWithElo.length !== 4) {
                    throw new Error("Se necesitan 4 confirmados para crear equipos");
                  }
                  const teams = await balanceTeams(playersWithElo);
                  setModal({ show: true, teams });
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Error creando equipos");
                }
              });
            }}
            disabled={isPending || s.confirmedCount < 4 || Boolean(s.occurrence.loaded_match_id)}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
            title={
              s.occurrence.loaded_match_id
                ? "Ya hay un partido creado para esta fecha"
                : s.confirmedCount < 4
                  ? "Confirmá 4 jugadores para crear equipos"
                  : "Crear partido con equipos sugeridos"
            }
          >
            Crear partido (equipos)
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-[color:var(--status-error-border)] bg-[color:var(--status-error-bg)] p-3 text-sm text-[color:var(--status-error-text)]">
          {error}
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Asistencia</p>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--status-success-bg)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--status-success-text)' }}>{summary.confirmedCount}</p>
              <p className="text-xs" style={{ color: 'var(--status-success-text-muted)' }}>Van</p>
            </div>
            <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--status-error-bg)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--status-error-text)' }}>{summary.declinedCount}</p>
              <p className="text-xs" style={{ color: 'var(--status-error-text-muted)' }}>No van</p>
            </div>
            <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--status-warning-bg)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--status-warning-text)' }}>{summary.maybeCount}</p>
              <p className="text-xs" style={{ color: 'var(--status-warning-text-muted)' }}>Tal vez</p>
            </div>
            <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--status-neutral-bg)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--status-neutral-text)' }}>{summary.waitlistCount}</p>
              <p className="text-xs" style={{ color: 'var(--status-neutral-text-muted)' }}>Espera</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">Jugador</label>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="w-full rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {usualPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus("confirmed")}
                disabled={isPending}
                className="rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-50"
                style={{
                  backgroundColor: currentStatus === "confirmed" ? 'var(--status-success-strong)' : 'var(--status-success-bg)',
                  color: currentStatus === "confirmed" ? 'var(--status-success-strong-text)' : 'var(--status-success-text)'
                }}
              >
                Voy
              </button>
              <button
                type="button"
                onClick={() => setStatus("maybe")}
                disabled={isPending}
                className="rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-50"
                style={{
                  backgroundColor: currentStatus === "maybe" ? 'var(--status-warning-strong)' : 'var(--status-warning-bg)',
                  color: currentStatus === "maybe" ? 'var(--status-warning-strong-text)' : 'var(--status-warning-text)'
                }}
              >
                Tal vez
              </button>
              <button
                type="button"
                onClick={() => setStatus("declined")}
                disabled={isPending}
                className="rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-50"
                style={{
                  backgroundColor: currentStatus === "declined" ? 'var(--status-error-strong)' : 'var(--status-error-bg)',
                  color: currentStatus === "declined" ? 'var(--status-error-strong-text)' : 'var(--status-error-text)'
                }}
              >
                No voy
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Quiénes están</p>

          <div className="mt-3 flex flex-col gap-3 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--status-success-text-muted)' }}>Van</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {confirmedPlayers.length === 0 ? (
                  <span className="text-[var(--muted)]">—</span>
                ) : (
                  confirmedPlayers.map((a) => (
                    <span
                      key={a.id}
                      className="rounded-full px-2 py-1 text-xs"
                      style={{
                        backgroundColor: 'var(--status-success-bg)',
                        color: 'var(--status-success-text)'
                      }}
                    >
                      {a.players?.name ?? "Jugador"}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--status-warning-text-muted)' }}>Tal vez</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {maybePlayers.length === 0 ? (
                  <span className="text-[var(--muted)]">—</span>
                ) : (
                  maybePlayers.map((a) => (
                    <span
                      key={a.id}
                      className="rounded-full px-2 py-1 text-xs"
                      style={{
                        backgroundColor: 'var(--status-warning-bg)',
                        color: 'var(--status-warning-text)'
                      }}
                    >
                      {a.players?.name ?? "Jugador"}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--status-error-text-muted)' }}>No van</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {declinedPlayers.length === 0 ? (
                  <span className="text-[var(--muted)]">—</span>
                ) : (
                  declinedPlayers.map((a) => (
                    <span
                      key={a.id}
                      className="rounded-full px-2 py-1 text-xs"
                      style={{
                        backgroundColor: 'var(--status-error-bg)',
                        color: 'var(--status-error-text)'
                      }}
                    >
                      {a.players?.name ?? "Jugador"}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-[var(--muted)]">
        Tip: los extras (calendario, challenges, venues, etc.) están en Beta/Labs.
      </p>

      {modal.show && modal.teams && (
        <TeamSuggestionModal
          occurrenceId={s.occurrence.id}
          slug={slug}
          initialTeams={modal.teams}
          onClose={() => setModal({ show: false, teams: null })}
          onError={(msg) => setError(msg)}
          onSuccess={() => {
            setModal({ show: false, teams: null });
            if (slug === "demo") {
              setError("Demo: partido creado (no se guarda en la DB)");
              return;
            }
            router.refresh();
          }}
          // Not ideal: we don't know the current user player id here.
          // For now, use the selected player as the creator.
          createdBy={selectedPlayer}
        />
      )}
    </section>
  );
}
