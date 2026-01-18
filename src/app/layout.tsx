import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const sans = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Padel Tracker",
  description: "Registro de partidos dobles, stats anuales y parejas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system">
          <div className="relative min-h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--ink)]">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(13,107,95,0.25),transparent_70%)] blur-2xl" />
              <div className="absolute right-0 top-48 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(242,169,0,0.28),transparent_70%)] blur-3xl" />
              <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(40,53,147,0.18),transparent_70%)] blur-3xl" />
            </div>

            <div className="relative">{children}</div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

