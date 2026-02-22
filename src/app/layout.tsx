import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { ToastHandlerWrapper } from "@/components/ToastHandlerWrapper";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const sans = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://padel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Padel Tracker - Track Your Matches, Stats & ELO Rankings",
    template: "%s | Padel Tracker",
  },
  description:
    "Multi-group padel tracker with group-scoped data, ELO rankings, match tracking, and passphrase-based access. Track your doubles matches, annual stats, and partnerships.",
  keywords: [
    "padel",
    "padel tennis",
    "padel tracker",
    "padel statistics",
    "ELO ranking",
    "doubles matches",
    "padel scores",
    "padel app",
    "sports tracking",
  ],
  authors: [{ name: "Padel Tracker" }],
  creator: "Padel Tracker",
  publisher: "Padel Tracker",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: siteUrl,
    siteName: "Padel Tracker",
    title: "Padel Tracker - Track Your Matches, Stats & ELO Rankings",
    description:
      "Multi-group padel tracker with group-scoped data, ELO rankings, match tracking, and passphrase-based access. Track your doubles matches, annual stats, and partnerships.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Padel Tracker - Track Your Padel Games",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Padel Tracker - Track Your Matches, Stats & ELO Rankings",
    description:
      "Multi-group padel tracker with ELO rankings, match tracking, and partnership stats.",
    images: ["/og-image.png"],
    creator: "@padeltracker",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${display.variable} ${sans.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system">
          <ToastHandlerWrapper />
          <div className="relative min-h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--ink)]">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(13,107,95,0.25),transparent_70%)] blur-2xl" />
              <div className="absolute right-0 top-48 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(242,169,0,0.28),transparent_70%)] blur-3xl" />
              <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(40,53,147,0.18),transparent_70%)] blur-3xl" />
            </div>

            <div className="relative">{children}</div>
          </div>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--card-solid)',
                border: '1px solid var(--card-border)',
                color: 'var(--ink)',
              },
              className: 'rounded-xl shadow-lg',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
