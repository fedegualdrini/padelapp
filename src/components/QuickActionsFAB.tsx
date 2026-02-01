"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Plus, X, Calendar, UserPlus, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type QuickActionsFABProps = {
  slug: string;
};

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  href: string;
  ariaLabel: string;
}

export default function QuickActionsFAB({ slug }: QuickActionsFABProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);
  const basePath = `/g/${slug}`;
  const pathname = usePathname();

  // Don't show on join page
  const shouldHide = pathname?.endsWith("/join");

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsExpanded(false);
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isExpanded) {
        setIsExpanded(true);
      }
    }

    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      setIsExpanded(true);
    }

    if ((e.key === "ArrowUp" || e.key === "ArrowLeft") && isExpanded) {
      setIsExpanded(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      icon: <Trophy size={18} />,
      label: "Cargar partido",
      href: `${basePath}/matches/new`,
      ariaLabel: "Cargar nuevo partido",
    },
    {
      icon: <Calendar size={18} />,
      label: "Crear evento",
      href: `${basePath}/events?create=true`,
      ariaLabel: "Crear nuevo evento",
    },
    {
      icon: <UserPlus size={18} />,
      label: "Nuevo jugador",
      href: `${basePath}/players#add-player`,
      ariaLabel: "Agregar nuevo jugador",
    },
    {
      icon: <Calendar size={18} />,
      label: "Ver calendario",
      href: `${basePath}/calendar`,
      ariaLabel: "Ver calendario de eventos",
    },
  ];

  // Dynamic positioning based on mobile/desktop
  const positionClass = isMobile ? "bottom-4 right-4" : "bottom-8 right-8";
  const fabSize = isMobile ? "w-14 h-14" : "w-12 h-12";

  // Don't render on join page
  if (shouldHide) {
    return null;
  }

  return (
    <div ref={fabRef} className={`fixed ${positionClass} z-50 flex flex-col items-end gap-3`}>
      {/* Secondary Actions */}
      {isExpanded && (
        <div className="flex flex-col items-end gap-3 animate-fade-in-up">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className="flex items-center gap-3"
              style={{
                animationDelay: `${index * 50}ms`,
                opacity: isExpanded ? 1 : 0,
              }}
            >
              <span className="px-2 py-1 text-xs font-medium bg-[var(--card-solid)] text-[var(--ink)] rounded border border-[color:var(--card-border)] opacity-0 animate-fade-in-label">
                {action.label}
              </span>
              <Link
                href={action.href}
                onClick={() => setIsExpanded(false)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--card-solid)] text-[var(--ink)] border border-[color:var(--card-border)] shadow-md transition-all duration-200 hover:bg-[var(--accent)] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
                aria-label={action.ariaLabel}
                role="menuitem"
              >
                {action.icon}
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Primary FAB */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={handleKeyDown}
        className={`flex items-center justify-center ${fabSize} rounded-full bg-[var(--accent)] text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] ${isExpanded ? "rotate-45" : ""}`}
        aria-label={isExpanded ? "Cerrar acciones rápidas" : "Abrir acciones rápidas"}
        aria-expanded={isExpanded}
        role="button"
        tabIndex={0}
        title={isExpanded ? "Cerrar" : "Cargar partido"}
      >
        {isExpanded ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
}
