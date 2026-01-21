import { getGroupBySlug, getPlayers, getPlayerStats } from "@/lib/data";
import AddPlayerForm from "./AddPlayerForm";
import EditPlayerForm from "./EditPlayerForm";
import FormIndicator from "@/components/FormIndicator";
import Link from "next/link";
import { notFound } from "next/navigation";

type PlayersPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PlayersPage({ params }: PlayersPageProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  // Layout already verifies group exists and user is a member
  if (!group) {
    notFound();
  }

  const [players, stats] = await Promise.all([
    getPlayers(group.id),
    getPlayerStats(group.id),
  ]);
  const statsByPlayer = new Map(
    stats.map((item) => [item.player_id, item])
  );
  const usuals = players.filter((player) => player.status === "usual");
  const invites = players.filter((player) => player.status === "invite");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Plantel
          </p>
          <h2 className="font-display text-2xl text-[var(--ink)]">Jugadores</h2>
        </div>
        <Link
          href={`/g/${group.slug}/players/compare`}
          className="rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-solid)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-0.5"
        >
          Comparar jugadores
        </Link>
      </div>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg text-[var(--ink)]">
              Agregar jugador
            </h3>
          </div>
          <AddPlayerForm groupId={group.id} groupSlug={group.slug} />
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <h3 className="font-display text-lg text-[var(--ink)]">Habituales</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {usuals.map((player) => {
            const stat = statsByPlayer.get(player.id);
            return (
              <div
                key={player.id}
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4"
              >
                <div className="flex items-center gap-2">
                  <EditPlayerForm
                    playerId={player.id}
                    initialName={player.name}
                    groupId={group.id}
                    groupSlug={group.slug}
                  />
                  <FormIndicator groupId={group.id} playerId={player.id} />
                </div>
                {stat ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {stat.wins}G - {stat.losses}P -{" "}
                    {Math.round((stat.win_rate ?? 0) * 100)}% de victorias
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Sin partidos
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <h3 className="font-display text-lg text-[var(--ink)]">Invitados</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {invites.map((player) => {
            const stat = statsByPlayer.get(player.id);
            return (
              <div
                key={player.id}
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4"
              >
                <div className="flex items-center gap-2">
                  <EditPlayerForm
                    playerId={player.id}
                    initialName={player.name}
                    groupId={group.id}
                    groupSlug={group.slug}
                  />
                  <FormIndicator groupId={group.id} playerId={player.id} />
                </div>
                {stat ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {stat.wins}G - {stat.losses}P -{" "}
                    {Math.round((stat.win_rate ?? 0) * 100)}% de victorias
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Disponible como suplente
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
