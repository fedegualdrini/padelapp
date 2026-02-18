type HeadingProps = {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4;
  className?: string;
};

/**
 * Heading - Consistent heading component using design tokens
 *
 * Uses CSS variables for consistent styling across the app:
 * - h1: 3xl (hero sections)
 * - h2: 2xl (page titles, main sections)
 * - h3: lg (subsection headers)
 * - h4: base (small section headers)
 */
export default function Heading({
  children,
  level = 2,
  className = "",
}: HeadingProps) {
  const sizeClasses = {
    1: "text-3xl",
    2: "text-2xl",
    3: "text-lg",
    4: "text-base",
  };

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Tag
      className={`font-display text-[var(--ink)] ${sizeClasses[level]} ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}
