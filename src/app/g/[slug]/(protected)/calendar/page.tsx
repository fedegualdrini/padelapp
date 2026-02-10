import { notFound } from "next/navigation";
import { getGroupBySlug, getCalendarData } from "@/lib/data";
import CalendarClient from "./CalendarClient";

type CalendarPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
};

export default async function CalendarPage({
  params,
  searchParams,
}: CalendarPageProps) {
  const { slug } = await params;
  const { year: yearParam, month: monthParam } = await searchParams;

  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  // Get current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Parse year/month from query params or use current
  const year = yearParam ? parseInt(yearParam, 10) : currentYear;
  const month = monthParam ? parseInt(monthParam, 10) : currentMonth;

  // Get calendar data
  const calendarData = await getCalendarData(group.id, year, month);

  return (
    <CalendarClient
      key={`${year}-${month}`}
      slug={slug}
      groupId={group.id}
      calendarData={calendarData}
      currentYear={currentYear}
      currentMonth={currentMonth}
    />
  );
}
