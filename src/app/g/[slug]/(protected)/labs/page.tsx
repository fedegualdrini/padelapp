import Link from "next/link";
import { notFound } from "next/navigation";
import { getGroupBySlug } from "@/lib/data";

type LabsPageProps = {
  params: Promise<{ slug: string }>;
};

const betaLinks: Array<{ href: string; title: string; desc: string }> = [
  {
    href: "/events",
    title: "Agenda / RSVP (Eventos)",
    desc: "Gestioná la asistencia y la generación de fechas del evento semanal.",
  },
  {
    href: "/calendar",
    title: "Calendario",
    desc: "Vista calendario de eventos y ocurrencias.",
  },
  {
    href: "/pairs",
    title: "Parejas",
    desc: "Historial y estadísticas por pareja.",
  },
  {
    href: "/partnerships",
    title: "Synergy / Partnerships",
    desc: "Analytics avanzados de química de parejas (beta).",
  },
  {
    href: "/venues",
    title: "Canchas",
    desc: "Venues + rating system (beta).",
  },
  {
    href: "/achievements",
    title: "Logros",
    desc: "Badges y achievements (beta).",
  },
  {
    href: "/challenges",
    title: "Desafíos",
    desc: "Retos semanales y streak rewards (beta).",
  },
];

export default async function LabsPage({ params }: LabsPageProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  const basePath = `/g/${slug}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Opcional</p>
        <h2 className="font-display text-2xl text-[var(--ink)]">Beta / Labs</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Estas secciones están en evolución. La experiencia principal del grupo vive en Inicio →
          asistencia → equipos → score → ranking.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {betaLinks.map((item) => (
          <Link
            key={item.href}
            href={`${basePath}${item.href}`}
            className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
          >
            <h3 className="font-display text-lg text-[var(--ink)]">{item.title}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
