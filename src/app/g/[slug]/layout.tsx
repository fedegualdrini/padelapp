import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getGroupBySlug } from "@/lib/data";

type GroupLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function GroupLayout({ children, params }: GroupLayoutProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  return (
    <AppShell groupName={group.name} slug={group.slug}>
      {children}
    </AppShell>
  );
}
