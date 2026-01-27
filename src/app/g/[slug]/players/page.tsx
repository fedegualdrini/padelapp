import { getGroupBySlug, getPlayers, getPlayerStats } from "@/lib/data";
import { notFound } from "next/navigation";
import PlayerDirectory from "@/components/PlayerDirectory";

type PlayersPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const isIsoDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export default async function PlayersPage({ params, searchParams }: PlayersPageProps) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};

  const qRaw = sp.q;
  const statusRaw = sp.status;

  const q = typeof qRaw === 'string' ? qRaw : undefined;
  const status = typeof statusRaw === 'string' ? (statusRaw as any) : undefined;

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
      q={q}
      status={status}
    />
  );
}
