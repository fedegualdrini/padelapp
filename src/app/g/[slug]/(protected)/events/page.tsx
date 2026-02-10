import { notFound } from "next/navigation";
import {
  getGroupBySlug,
  getWeeklyEvents,
  getUpcomingOccurrences,
  getPastOccurrences,
  getAttendanceSummary,
  getPlayers,
} from "@/lib/data";
import EventsClient from "./EventsClient";

type EventsPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EventsPage({ params }: EventsPageProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  const [weeklyEvents, upcomingOccurrences, pastOccurrences, players] = await Promise.all([
    getWeeklyEvents(group.id),
    getUpcomingOccurrences(group.id, 6),
    getPastOccurrences(group.id, 5),
    getPlayers(group.id),
  ]);

  const [upcomingSummaries, pastSummaries] = await Promise.all([
    getAttendanceSummary(group.id, upcomingOccurrences, weeklyEvents),
    getAttendanceSummary(group.id, pastOccurrences, weeklyEvents),
  ]);

  return (
    <EventsClient
      slug={slug}
      groupId={group.id}
      weeklyEvents={weeklyEvents}
      upcomingSummaries={upcomingSummaries}
      pastSummaries={pastSummaries}
      players={players}
    />
  );
}
