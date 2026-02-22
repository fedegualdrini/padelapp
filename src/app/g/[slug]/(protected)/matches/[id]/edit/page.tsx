import { notFound } from "next/navigation";
import { getGroupBySlug, getMatchEditData, getPlayers } from "@/lib/data";
import EditMatchForm from "./EditMatchForm";

type EditMatchPageProps = {
  params: Promise<{ slug: string; id: string }>;
};

export default async function EditMatchPage({ params }: EditMatchPageProps) {
  const { slug, id } = await params;
  const group = await getGroupBySlug(slug);

  // Layout already verifies group exists and user is a member
  if (!group) {
    notFound();
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

      <EditMatchForm
        match={match}
        players={players}
        groupId={group.id}
        groupSlug={group.slug}
      />
    </div>
  );
}
