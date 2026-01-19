import { redirect } from "next/navigation";
import { getGroupBySlug, getMatchEditData, getPlayers } from "@/lib/data";
import { updateMatch } from "@/app/matches/[id]/edit/actions";

type EditMatchPageProps = {
  params: Promise<{ slug: string; id: string }>;
};

export default async function EditMatchPage({ params }: EditMatchPageProps) {
  const { slug, id } = await params;
  const group = await getGroupBySlug(slug);

  // Layout already verifies group exists and user is a member
  if (!group) {
    return null;
  }

  const [players, match] = await Promise.all([
    getPlayers(group.id),
    getMatchEditData(group.id, id),
  ]);

  if (!match) {
    return (
      <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 text-sm text-[var(--muted)] shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        Partido no encontrado.
      </div>
    );
  }

  const playerOptions = players.map((player) => (
    <option key={player.id} value={player.id}>
      {player.name}
    </option>
  ));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Edición de partido
        </p>
        <h2 className="font-display text-2xl text-[var(--ink)]">
          Editar partido
        </h2>
      </div>

      <form className="grid gap-6" action={updateMatch}>
        <input type="hidden" name="match_id" value={match.id} />
        <input type="hidden" name="group_id" value={group.id} />
        <input type="hidden" name="group_slug" value={group.slug} />
        <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <h3 className="font-display text-lg text-[var(--ink)]">
            Info del partido
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Fecha
              <input
                type="date"
                name="played_date"
                defaultValue={match.date}
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Hora
              <input
                type="time"
                name="played_time"
                defaultValue={match.time}
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Mejor de
              <select
                name="best_of"
                defaultValue={String(match.bestOf)}
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
              >
                <option value="3">3 sets</option>
                <option value="5">5 sets</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Editado por
              <input
                type="text"
                name="updated_by"
                placeholder="Tu nombre"
                defaultValue={match.createdBy}
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <h3 className="font-display text-lg text-[var(--ink)]">Equipos</h3>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Equipo 1
              </p>
              <div className="mt-3 grid gap-3">
                <select
                  name="team1_player1"
                  defaultValue={match.teamPlayers[0]?.[0] ?? ""}
                  className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
                >
                  <option value="">Elegir jugador</option>
                  {playerOptions}
                </select>
                <select
                  name="team1_player2"
                  defaultValue={match.teamPlayers[0]?.[1] ?? ""}
                  className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
                >
                  <option value="">Elegir jugador</option>
                  {playerOptions}
                </select>
              </div>
            </div>
            <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Equipo 2
              </p>
              <div className="mt-3 grid gap-3">
                <select
                  name="team2_player1"
                  defaultValue={match.teamPlayers[1]?.[0] ?? ""}
                  className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
                >
                  <option value="">Elegir jugador</option>
                  {playerOptions}
                </select>
                <select
                  name="team2_player2"
                  defaultValue={match.teamPlayers[1]?.[1] ?? ""}
                  className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
                >
                  <option value="">Elegir jugador</option>
                  {playerOptions}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg text-[var(--ink)]">
              Marcador por set
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Cargá todos los sets jugados (máx. 5)
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            {[1, 2, 3, 4, 5].map((setNumber) => {
              const set = match.setScores.find(
                (item) => item.setNumber === setNumber
              );
              return (
                <div
                  key={setNumber}
                  className="grid grid-cols-[80px_repeat(2,1fr)] items-center gap-3"
                >
                  <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Set {setNumber}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={7}
                    placeholder="Equipo 1"
                    name={`set${setNumber}_team1`}
                    defaultValue={set?.team1 ?? ""}
                    className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    min={0}
                    max={7}
                    placeholder="Equipo 2"
                    name={`set${setNumber}_team2`}
                    defaultValue={set?.team2 ?? ""}
                    className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
                  />
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-full bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-white"
          >
            Guardar cambios
          </button>
          <button
            type="button"
            className="rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] px-6 py-2 text-sm font-semibold text-[var(--ink)]"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
