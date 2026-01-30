"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "", label: "Panel" },
  { href: "/matches", label: "Partidos" },
  { href: "/matches/new", label: "Nuevo partido" },
  { href: "/events", label: "Eventos" },
  { href: "/ranking", label: "Ranking" },
  { href: "/players", label: "Jugadores" },
  { href: "/pairs", label: "Parejas" },
  { href: "/achievements", label: "Logros" },
  { href: "/challenges", label: "Desafíos" },
];

type NavBarProps = {
  basePath: string;
};

export default function NavBar({ basePath }: NavBarProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 rounded-2xl border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] p-2 backdrop-blur">
      {links.map((link) => {
        const href = `${basePath}${link.href}`;
        const matchesPath = `${basePath}/matches`;
        const newMatchPath = `${basePath}/matches/new`;
        const isMatchesActive =
          link.href === "/matches" &&
          (pathname === matchesPath || pathname.startsWith(`${matchesPath}/`)) &&
          pathname !== newMatchPath;
        const isActive = pathname === href || isMatchesActive;
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] ${
              isActive
                ? "bg-[var(--accent)] text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)]"
                : "text-[var(--ink)] hover:bg-[color:var(--card-solid)]"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

