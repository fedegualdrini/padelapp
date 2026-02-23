import { MarketingShell } from "@/components/layout/MarketingShell";
import Link from "next/link";

export default function Home() {
  return (
    <MarketingShell>
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center pt-10 pb-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-white dark:bg-background-dark">
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div
              style={{
                backgroundImage: `radial-gradient(var(--color-primary) 0.5px, transparent 0.5px), radial-gradient(var(--color-primary) 0.5px, transparent 0.5px)`,
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 10px 10px",
              }}
              className="w-full h-full"
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-background-dark dark:text-primary font-bold text-sm mb-8 border border-primary/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Join 50,000+ players worldwide
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-8xl font-black text-background-dark dark:text-white leading-[1.1] tracking-tight mb-8">
            The Pulse of <br />
            <span className="text-primary italic">Padel</span>
          </h1>

          {/* Description */}
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-background-dark/60 dark:text-slate-400 mb-12 leading-relaxed">
            Connect with players, book championship-grade courts, and climb the global rankings. All in one premium platform built for the sport.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/join">
              <button className="w-full sm:w-auto px-10 py-5 bg-primary text-background-dark font-black text-lg rounded-full shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all">
                Join the Community
              </button>
            </Link>
            <Link href="/venues">
              <button className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 font-bold text-lg rounded-full hover:bg-slate-50 transition-all">
                Explore Venues
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-background-dark py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <p className="text-primary text-4xl font-black mb-1">50k+</p>
            <p className="text-slate-400 font-medium">Active Players</p>
          </div>
          <div className="text-center">
            <p className="text-primary text-4xl font-black mb-1">200+</p>
            <p className="text-slate-400 font-medium">Premium Courts</p>
          </div>
          <div className="text-center">
            <p className="text-primary text-4xl font-black mb-1">150k+</p>
            <p className="text-slate-400 font-medium">Matches Played</p>
          </div>
          <div className="text-center">
            <p className="text-primary text-4xl font-black mb-1">4.9/5</p>
            <p className="text-slate-400 font-medium">App Rating</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-white dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-background-dark dark:text-white mb-6">
              Three Pillars of the Game
            </h2>
            <p className="text-lg text-background-dark/60 dark:text-slate-400 max-w-2xl mx-auto">
              Elevate your game with a platform designed specifically for the requirements of modern padel athletes and facility owners.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Social Feed Card */}
            <div className="bg-background-light dark:bg-slate-800/50 rounded-xl p-8 border border-slate-200 dark:border-slate-700 flex flex-col h-full">
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-background-dark text-3xl">
                  chat
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Social Feed</h3>
              <p className="text-background-dark/60 dark:text-slate-400 mb-8">
                Stay updated with match results, local tournament news, and community highlights in real-time.
              </p>
              {/* Feed UI Mockup */}
              <div className="mt-auto bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold">SK</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">Sarah Jenkins <span className="text-xs font-normal text-slate-400">• 2h ago</span></p>
                    <div className="mt-2 bg-primary/10 rounded-lg p-3 border border-primary/20">
                      <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-background-dark mb-1">
                        <span>Premier League match</span>
                        <span>WIN</span>
                      </div>
                      <p className="text-sm font-bold">Jenkins/Doe def. Smith/Lee</p>
                      <p className="text-xs text-slate-500 mt-1 italic">&quot;Great match everyone! 🎾&quot;</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Court Booking Card */}
            <div className="bg-background-light dark:bg-slate-800/50 rounded-xl p-8 border border-slate-200 dark:border-slate-700 flex flex-col h-full">
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-background-dark text-3xl">
                  calendar_today
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Court Booking</h3>
              <p className="text-background-dark/60 dark:text-slate-400 mb-8">
                Find and book the best courts near you in seconds with our clean, intuitive calendar interface.
              </p>
              {/* Booking UI Mockup */}
              <div className="mt-auto bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm font-bold">Friday, Oct 24</p>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2 text-xs font-bold border border-primary bg-primary/10 rounded-lg">18:00 - 19:30</button>
                  <button className="py-2 text-xs font-bold border border-slate-200 rounded-lg text-slate-400">19:30 - 21:00</button>
                  <button className="py-2 text-xs font-bold border border-primary bg-primary/10 rounded-lg">21:00 - 22:30</button>
                  <button className="py-2 text-xs font-bold border border-slate-200 rounded-lg text-slate-400">22:30 - 00:00</button>
                </div>
              </div>
            </div>

            {/* Player Rankings Card */}
            <div className="bg-background-light dark:bg-slate-800/50 rounded-xl p-8 border border-slate-200 dark:border-slate-700 flex flex-col h-full">
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-background-dark text-3xl">
                  trophy
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Player Rankings</h3>
              <p className="text-background-dark/60 dark:text-slate-400 mb-8">
                Track your progress, challenge top-tier players, and rise through the competitive global ranks.
              </p>
              {/* Ranking UI Mockup */}
              <div className="mt-auto bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between p-2 bg-primary/5 rounded-lg border-l-4 border-primary">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm">#1</span>
                    <span className="text-sm font-medium">Marcello G.</span>
                  </div>
                  <span className="text-xs font-black">2,450 pts</span>
                </div>
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-400">#2</span>
                    <span className="text-sm font-medium">Lisa Wang</span>
                  </div>
                  <span className="text-xs font-black">2,310 pts</span>
                </div>
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-400">#3</span>
                    <span className="text-sm font-medium">David Ruiz</span>
                  </div>
                  <span className="text-xs font-black">2,180 pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-wimbledon-green rounded-xl p-12 md:p-20 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32"></div>

          <h2 className="text-4xl md:text-5xl font-black text-white mb-8 relative z-10">
            Ready to step on the court?
          </h2>
          <p className="text-slate-300 text-lg mb-12 max-w-xl mx-auto relative z-10">
            Join the fastest growing sports community. Book your first match in less than 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Link href="/join">
              <button className="px-8 py-4 bg-primary text-background-dark font-black rounded-full hover:shadow-xl transition-all">
                Join Now
              </button>
            </Link>
            <button className="px-8 py-4 bg-transparent border-2 border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-all">
              Learn More
            </button>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
