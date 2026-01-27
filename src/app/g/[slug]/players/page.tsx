import { getGroupBySlug, getPlayers, getPlayerStats } from "@/lib/data";
import { notFound } from "next/navigation";
import PlayerDirectory from "@/components/PlayerDirectory";

type PlayersPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PlayersPage({ params }: PlayersPageProps) {
  const { slug } = await params;

  const group = await getGroupBySlug(slug);
  if (!group) {
    notFound();
  }

  const [players, stats] = await Promise.all([
    getPlayers(group.id),
    getPlayerStats(group.id),
  ]);

  return (
    <PlayerDirectory
      groupId={group.id}
      groupSlug={group.slug}
      players={players}
      stats={stats}
    />
  );
}
