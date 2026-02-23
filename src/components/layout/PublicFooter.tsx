import Link from "next/link";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  const platformLinks = [
    { href: "/venues", label: "Find a Court" },
    { href: "/groups", label: "Global Rankings" },
    { href: "/#features", label: "Tournaments" },
    { href: "/#community", label: "For Clubs" },
  ];

  const companyLinks = [
    { href: "/#about", label: "About Us" },
    { href: "/#careers", label: "Careers" },
    { href: "/#privacy", label: "Privacy Policy" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <footer className="bg-background-dark text-slate-400 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-primary p-1 rounded-md">
                <span className="material-symbols-outlined text-background-dark text-sm font-bold">
                  sports_tennis
                </span>
              </div>
              <h2 className="text-white text-xl font-black tracking-tighter">
                PadelApp
              </h2>
            </div>
            <p className="max-w-xs mb-8">
              The complete ecosystem for players, clubs, and enthusiasts. Connecting the
              world through Padel.
            </p>
            <div className="flex gap-4">
              <a
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-background-dark transition-all"
                href="#"
              >
                <span className="material-symbols-outlined text-sm">public</span>
              </a>
              <a
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-background-dark transition-all"
                href="#"
              >
                <span className="material-symbols-outlined text-sm">alternate_email</span>
              </a>
              <a
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-background-dark transition-all"
                href="#"
              >
                <span className="material-symbols-outlined text-sm">play_arrow</span>
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-white font-bold mb-6">Platform</h3>
            <ul className="space-y-4">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-bold mb-6">Company</h3>
            <ul className="space-y-4">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>© {currentYear} PadelApp Global Ltd. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="/#terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/#cookies" className="hover:text-white transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
