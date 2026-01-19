import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getGroupBySlug } from "@/lib/data";

type JoinLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function JoinLayout({ children, params }: JoinLayoutProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  // Simple layout without navigation for join page
  return (
    <AppShell groupName={group.name} slug={group.slug} showNavigation={false}>
      {children}
    </AppShell>
  );
}
