import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

interface MarketingShellProps {
  children: React.ReactNode;
}

export function MarketingShell({ children }: MarketingShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
