import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getGroupBySlug, isGroupMember } from "@/lib/data";

type ProtectedLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function ProtectedLayout({ children, params }: ProtectedLayoutProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  // Always check membership for protected routes
  const isMember = await isGroupMember(group.id);
  if (!isMember) {
    redirect(`/g/${slug}/join`);
  }

  // Always show navigation in protected area
  return (
    <AppShell groupName={group.name} slug={group.slug} showNavigation={true}>
      {children}
    </AppShell>
  );
}
