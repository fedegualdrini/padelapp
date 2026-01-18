import { redirect } from "next/navigation";
import { getGroupBySlug, getPlayers, getUsualPairs, isGroupMember } from "@/lib/data";
import NewMatchForm from "@/components/NewMatchForm";

type NewMatchPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function NewMatchPage({ params }: NewMatchPageProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    redirect(`/g/${slug}/join`);
  }

  const isMember = await isGroupMember(group.id);
  if (!isMember) {
    redirect(`/g/${slug}/join`);
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
