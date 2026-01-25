import AppShell from "@/components/AppShell";
import { getGroupBySlug, getPlayers, getPlayerStats, isGroupMember } from "@/lib/data";
import { notFound } from "next/navigation";
import AddPlayerForm from "./AddPlayerForm";
import EditPlayerForm from "./EditPlayerForm";
import FormIndicator from "@/components/FormIndicator";

type PlayersPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PlayersPage({ params }: PlayersPageProps) {
  const { slug } = await params;

  const group = await getGroupBySlug(slug);
  if (!group) {
    notFound();
  }

  const isMember = await isGroupMember(group.id);
  if (!isMember) {
    notFound();
  }

  const [players, stats] = await Promise.all([
    getPlayers(group.id),
    getPlayerStats(group.id),
  ]);

  const statsByPlayer = new Map(stats.map((row) => [row.player_id, row]));

  const usuals = players.filter((player) => player.status === "usual");
  const invites = players.filter((player) => player.status !== "usual");

  return (
    <AppShell groupName={group.name} slug={group.slug}>
      <div className="space-y-6">
        <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <h2 className="font-display text-2xl text-[var(--ink)]">Jugadores</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Sumá jugadores habituales e invitados.
          </p>
          <AddPlayerForm groupId={group.id} groupSlug={group.slug} />
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
                      {stat.matches_played} partidos · {stat.wins}G - {stat.losses}P
                      {stat.undecided ? ` · ${stat.undecided} sin resultado` : ""} ·{" "}
                      {Math.round((stat.win_rate ?? 0) * 100)}% de victorias
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-[var(--muted)]">Sin partidos</p>
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
                      {stat.matches_played} partidos · {stat.wins}G - {stat.losses}P
                      {stat.undecided ? ` · ${stat.undecided} sin resultado` : ""} ·{" "}
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
    </AppShell>
  );
}
