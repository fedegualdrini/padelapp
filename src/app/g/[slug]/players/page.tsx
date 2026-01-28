import { getGroupBySlug, getPlayers, getPlayerStats, getPlayerEloChange } from "@/lib/data";
import { notFound } from "next/navigation";
import PlayerDirectory from "@/components/PlayerDirectory";
import { parsePeriodFromParams } from "@/components/PeriodSelector";

type PlayersPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PlayersPage({ params, searchParams }: PlayersPageProps) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};

  const qRaw = sp.q;
  const statusRaw = sp.status;

  const q = typeof qRaw === "string" ? qRaw : undefined;

  const allowedStatuses = ["all", "usual", "invite"] as const;
  type AllowedStatus = (typeof allowedStatuses)[number];

  const status =
    typeof statusRaw === "string" && allowedStatuses.includes(statusRaw as AllowedStatus)
      ? (statusRaw as AllowedStatus)
      : undefined;

  const period = parsePeriodFromParams(new URLSearchParams(sp as Record<string, string>));
  const { preset, startDate, endDate } = period.preset === 'custom' ? period : { preset: period.preset, startDate: undefined, endDate: undefined };

  const group = await getGroupBySlug(slug);
  if (!group) {
    notFound();
  }

  const [players, stats] = await Promise.all([
    getPlayers(group.id),
    getPlayerStats(group.id, startDate, endDate),
  ]);

  return (
    <PlayerDirectory
      groupId={group.id}
      groupSlug={group.slug}
      players={players}
      stats={stats}
      q={q}
      status={status}
      period={period}
    />
  );
}
