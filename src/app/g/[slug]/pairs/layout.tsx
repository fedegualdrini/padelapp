import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getGroupBySlug, isGroupMember } from "@/lib/data";

type PairsLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function PairsLayout({ children, params }: PairsLayoutProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  // Check membership for protected routes
  const isMember = await isGroupMember(group.id);
  if (!isMember) {
    redirect(`/g/${slug}/join`);
  }

  // Show navigation for authenticated users
  return (
    <AppShell groupName={group.name} slug={group.slug} showNavigation={true}>
      {children}
    </AppShell>
  );
}
