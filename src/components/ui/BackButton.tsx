import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type BackButtonProps = {
  href: string;
  label: string;
  variant?: "button" | "link";
};

/**
 * BackButton - Consistent back navigation component
 *
 * Variants:
 * - "button": Rounded pill button with glass effect (default for detail pages)
 * - "link": Simple text link (for form pages)
 */
export default function BackButton({ href, label, variant = "button" }: BackButtonProps) {
  if (variant === "link") {
    return (
      <Link
        href={href}
        className="text-sm font-medium text-[var(--accent)] hover:underline"
      >
        ← {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
    >
      ← {label}
    </Link>
  );
}
