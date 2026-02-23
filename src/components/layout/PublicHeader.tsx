"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PublicHeader() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/venues", label: "Venues" },
    { href: "/groups", label: "Groups" },
    { href: "/#features", label: "Features" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-background-dark font-bold">
              sports_tennis
            </span>
          </div>
          <Link href="/">
            <h2 className="text-background-dark dark:text-white text-2xl font-black tracking-tighter cursor-pointer">
              PadelApp
            </h2>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-10">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-background-dark/70 dark:text-slate-300 hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <Link href="/#join">
            <button className="hidden sm:flex px-6 py-2.5 bg-primary text-background-dark font-bold rounded-full hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
              Get Started
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
