"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "", label: "Inicio", priority: true },
  { href: "/matches", label: "Partidos", priority: true },
  { href: "/ranking", label: "Ranking", priority: true },
  // "Grupo" is the place to manage the roster/passphrase and day-to-day admin.
  { href: "/players", label: "Grupo", priority: true },
  // Moved from Labs to main nav for better discoverability (retention analysis)
  { href: "/achievements", label: "Logros", priority: false },
  { href: "/challenges", label: "Desafíos", priority: false },
  { href: "/calendar", label: "Calendario", priority: false },
  { href: "/pairs", label: "Parejas", priority: false },
  // Everything experimental lives here.
  { href: "/labs", label: "Beta/Labs", priority: false },
];

type NavBarProps = {
  basePath: string;
};

export default function NavBar({ basePath }: NavBarProps) {
  const pathname = usePathname();

  return (
    <nav className="relative flex gap-2 overflow-x-auto rounded-2xl border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] p-2 backdrop-blur scrollbar-hide">
      {links.map((link) => {
        const href = `${basePath}${link.href}`;
        const matchesPath = `${basePath}/matches`;
        const isMatchesActive =
          link.href === "/matches" &&
          (pathname === matchesPath || pathname.startsWith(`${matchesPath}/`));
        const isActive = pathname === href || isMatchesActive;

        // Mobile optimization: reduce padding on small screens for secondary links
        const isMobileSecondary = !link.priority;

        return (
          <Link
            key={href}
            href={href}
            className={`whitespace-nowrap rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] shrink-0 min-h-[40px] flex items-center
              ${isMobileSecondary ? 'px-2.5 py-2 sm:px-4 sm:py-2' : 'px-3 py-2 sm:px-4 sm:py-2'}`}
          >
            <span
              className={
                isActive
                  ? "bg-[var(--accent)] text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)] rounded-full px-2.5 py-1 sm:px-3 sm:py-1 block"
                  : "text-[var(--ink)] hover:bg-[color:var(--card-solid)] rounded-full px-2.5 py-1 sm:px-3 sm:py-1 block"
              }
            >
              {link.label}
            </span>
          </Link>
        );
      })}
      {/* Add a visual indicator that there's more content on mobile */}
      <div className="sm:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[color:var(--card-glass)] to-transparent pointer-events-none" />
    </nav>
  );
}

