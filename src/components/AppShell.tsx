import Link from "next/link";
import NavBar from "@/components/NavBar";
import ThemeToggle from "@/components/ThemeToggle";

type AppShellProps = {
  groupName: string;
  slug: string;
  children: React.ReactNode;
  showNavigation?: boolean;
};

export default function AppShell({ groupName, slug, children, showNavigation = true }: AppShellProps) {
  const basePath = `/g/${slug}`;

  return (
    <div className="relative">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-6 pt-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              {showNavigation ? groupName : ""}
            </p>
            <h1 className="font-display text-3xl text-[var(--ink)] sm:text-4xl">
              Padel Tracker
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            {showNavigation && (
              <Link
                href={`${basePath}/matches/new`}
                className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(13,107,95,0.25)] transition hover:-translate-y-0.5"
              >
                Nuevo partido
              </Link>
            )}
          </div>
        </div>
        {showNavigation && (
          <>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-soft)] px-4 py-3 backdrop-blur">
              <p className="text-sm text-[var(--muted)]">
                Registrá sets completos, química de parejas y ELO todo el año.
              </p>
              <Link
                href={`${basePath}/matches`}
                className="text-sm font-semibold text-[var(--accent)]"
              >
                Ver partidos &gt;
              </Link>
            </div>
            <NavBar basePath={basePath} />
          </>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        {children}
      </main>
    </div>
  );
}
