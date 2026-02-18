/**
 * ShareShell - Consistent layout for share pages
 *
 * Provides consistent padding, typography, and visual style for share pages
 * optimized for screenshot quality (Apple/Google social sharing guidelines).
 *
 * Key principles:
 * - Consistent horizontal padding: 16px on mobile, 32px on desktop
 * - Optimal line length: 45-75 characters for readability
 * - Proper vertical rhythm: 8px grid system
 * - High contrast text for screenshot clarity
 * - Mobile-first responsive design
 */

interface ShareShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
}

export default function ShareShell({
  children,
  title,
  subtitle,
  description,
}: ShareShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header Section - Consistent branding */}
      <header className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 lg:py-8">
        {(title || subtitle || description) && (
          <div className="space-y-2 sm:space-y-3">
            {subtitle && (
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] sm:text-sm">
                {subtitle}
              </p>
            )}
            {title && (
              <h1 className="font-display text-2xl font-medium text-[var(--ink)] sm:text-3xl lg:text-4xl">
                {title}
              </h1>
            )}
            {description && (
              <p className="max-w-2xl text-sm text-[var(--muted)] sm:text-base">
                {description}
              </p>
            )}
          </div>
        )}
      </header>

      {/* Main Content - Consistent padding and max-width */}
      <main className="mx-auto w-full max-w-5xl px-4 pb-12 sm:px-8 lg:pb-16">
        <div className="space-y-6 lg:space-y-8">{children}</div>
      </main>
    </div>
  );
}
