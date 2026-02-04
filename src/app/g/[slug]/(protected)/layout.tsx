import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getGroupBySlug, isGroupMember } from "@/lib/data";
import { hasSupabaseEnv } from "@/lib/supabase/server";

type ProtectedLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

function SetupRequiredProtected() {
  return (
    <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 text-sm text-[var(--muted)] shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
      <p className="font-semibold text-[var(--ink)]">Setup requerido</p>
      <p className="mt-2">
        Falta configurar <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span> y{" "}
        <span className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> para poder cargar el grupo.
      </p>
    </div>
  );
}

export default async function ProtectedLayout({ children, params }: ProtectedLayoutProps) {
  const { slug } = await params;

  if (!hasSupabaseEnv()) {
    // Render a shell without navigation (since group data isn't available) and avoid crashing.
    return (
      <AppShell groupName="Padel Tracker" slug={slug} showNavigation={false}>
        <SetupRequiredProtected />
      </AppShell>
    );
  }

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
