"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!isMounted) {
    return (
      <button
        type="button"
        className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-glass)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
        aria-label="Cambiar tema"
      >
        Tema
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-glass)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
      aria-label="Cambiar tema"
    >
      {isDark ? "Modo claro" : "Modo oscuro"}
    </button>
  );
}

