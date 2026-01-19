import { getGroupBySlug, getPlayers, getUsualPairs } from "@/lib/data";
import NewMatchForm from "@/components/NewMatchForm";
import { notFound } from "next/navigation";

type NewMatchPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function NewMatchPage({ params }: NewMatchPageProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  // Layout already verifies group exists and user is a member
  if (!group) {
    notFound();
  }

  const [players, usualPairs] = await Promise.all([
    getPlayers(group.id),
    getUsualPairs(group.id),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Carga de partido
        </p>
        <h2 className="font-display text-2xl text-[var(--ink)]">
          Cargar un nuevo partido
        </h2>
      </div>

      <NewMatchForm
        players={players}
        usualPairs={usualPairs}
        defaultDate={today}
        groupId={group.id}
        groupSlug={group.slug}
      />
    </div>
  );
}
