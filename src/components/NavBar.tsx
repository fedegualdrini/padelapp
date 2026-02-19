"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "", label: "Inicio" },
  { href: "/matches", label: "Partidos" },
  { href: "/venues", label: "Canchas" },
  { href: "/ranking", label: "Ranking" },
  // "Grupo" is the place to manage the roster/passphrase and day-to-day admin.
  { href: "/players", label: "Grupo" },
  // Moved from Labs to main nav for better discoverability (retention analysis)
  { href: "/achievements", label: "Logros" },
  { href: "/challenges", label: "Desafíos" },
  { href: "/calendar", label: "Calendario" },
  { href: "/pairs", label: "Parejas" },
  // Everything experimental lives here.
  { href: "/labs", label: "Beta/Labs" },
];

type NavBarProps = {
  basePath: string;
};

export default function NavBar({ basePath }: NavBarProps) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] p-2 backdrop-blur scrollbar-hide">
      {links.map((link) => {
        const href = `${basePath}${link.href}`;
        const matchesPath = `${basePath}/matches`;
        const isMatchesActive =
          link.href === "/matches" &&
          (pathname === matchesPath || pathname.startsWith(`${matchesPath}/`));
        const isActive = pathname === href || isMatchesActive;
        return (
          <Link
            key={href}
            href={href}
            className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] shrink-0"
          >
            <span
              className={
                isActive
                  ? "bg-[var(--accent)] text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)] rounded-full px-3 py-1 block"
                  : "text-[var(--ink)] hover:bg-[color:var(--card-solid)] rounded-full px-3 py-1 block"
              }
            >
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

