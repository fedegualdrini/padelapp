import { redirect } from "next/navigation";
import { getGroupBySlug, getPlayers, getPlayerStats, isGroupMember } from "@/lib/data";
import { addInvite } from "@/app/players/actions";

type PlayersPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PlayersPage({ params }: PlayersPageProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    redirect(`/g/${slug}/join`);
  }

  const isMember = await isGroupMember(group.id);
  if (!isMember) {
    redirect(`/g/${slug}/join`);
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
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Plantel
        </p>
        <h2 className="font-display text-2xl text-[var(--ink)]">Jugadores</h2>
      </div>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Invitados
            </p>
            <h3 className="font-display text-lg text-[var(--ink)]">
              Agregar invitado
            </h3>
          </div>
          <form action={addInvite} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="group_id" value={group.id} />
            <input type="hidden" name="group_slug" value={group.slug} />
            <input
              type="text"
              name="invite_name"
              placeholder="Nombre del invitado"
              className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-4 py-2 text-sm"
            />
            <input
              type="text"
              name="created_by"
              placeholder="Agregado por (opcional)"
              className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-4 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              Agregar invitado
            </button>
          </form>
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
                <p className="text-base font-semibold text-[var(--ink)]">
                  {player.name}
                </p>
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
                <p className="text-base font-semibold text-[var(--ink)]">
                  {player.name}
                </p>
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
