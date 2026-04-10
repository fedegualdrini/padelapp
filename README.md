# 🎾 PadelApp

A modern, full-featured web application for tracking padel matches, managing group rankings, and analyzing player and pair statistics — with group-scoped data isolation and ELO-based leaderboards.

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
[![CI](https://github.com/fedegualdrini/padelapp/actions/workflows/ci.yml/badge.svg)](https://github.com/fedegualdrini/padelapp/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16.0+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0+-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

## 🚀 Features

### 🏆 **Core Match Tracking**
- **Best-of-3/5 Format**: Full doubles match recording with set-by-set scores
- **Player Management**: Create and manage player profiles within your group
- **Match History**: Browse, filter, and edit past matches
- **Public Sharing**: Share individual matches and rankings via public links with Open Graph cards

### 📊 **ELO Rankings & Analytics**
- **ELO System**: Dynamic ELO ratings with margin-based calculations and weekly decay for inactive players
- **Leaderboard**: Real-time group rankings with trend indicators
- **Pair Statistics**: Partnership analytics showing win rates and chemistry between specific players
- **Achievements**: Milestone-based achievement system to celebrate player accomplishments
- **Challenges**: Leaderboard challenge system for head-to-head competition tracking

### 👥 **Group Management**
- **Multi-Group Support**: Create or join multiple independent groups — all data fully isolated per group
- **Passphrase Access**: Secure group access via bcrypt-hashed passphrases (no email/password required)
- **Guest Invites**: Token-based invite links for frictionless onboarding
- **Anonymous Auth**: Supabase anonymous authentication — no account creation needed

### 📅 **Events & Calendar**
- **Event Scheduling**: Plan and manage padel sessions within your group
- **Calendar View**: Monthly calendar with event listing and navigation
- **Venue Management**: Rate and review courts, track venue details and amenities

### 🎨 **Modern UI/UX**
- **Responsive Design**: Mobile-first layout optimized for on-court use
- **Dark/Light Themes**: Automatic theme switching with system preference detection
- **Smooth Interactions**: Toast notifications, collapsible sections, and animated transitions
- **Interactive Charts**: ELO progression charts powered by Lightweight Charts

## 🛠️ Technology Stack

### **Frontend Framework**
- **Next.js 16**: App Router with Server Components and server actions
- **React 19**: Modern React with hooks and functional components
- **TypeScript**: Full type safety across the entire codebase

### **Styling & UI**
- **Tailwind CSS v4**: Utility-first CSS with custom CSS variables
- **Lucide React**: Customizable icon library
- **next-themes**: Seamless dark/light mode management
- **Sonner**: Elegant toast notification system

### **Backend & Auth**
- **Supabase**: PostgreSQL database with Row Level Security (RLS)
- **Supabase SSR**: Server-side rendering integration for secure data access
- **Anonymous Auth**: Stateless anonymous sessions — no sign-up friction
- **pgcrypto**: PostgreSQL extension for bcrypt passphrase hashing

### **Data & State**
- **SWR**: Stale-while-revalidate data fetching for client components
- **Server Components**: Preferred data fetching pattern for SSR
- **Materialized Views**: Pre-computed ELO and pair stats for fast queries

### **Visualization & Charts**
- **Lightweight Charts**: High-performance ELO trend charts

### **Testing**
- **Vitest**: Unit and integration testing
- **Playwright**: End-to-end browser testing

## 📁 Project Structure

```
src/
├── app/
│   ├── g/[slug]/                    # Group-scoped routes
│   │   ├── join/                    # Passphrase join page
│   │   ├── (protected)/             # Membership-required pages
│   │   │   ├── matches/             # Match listing, creation, editing
│   │   │   ├── players/             # Player profiles and stats
│   │   │   ├── pairs/               # Pair statistics
│   │   │   ├── partnerships/        # Partnership analytics
│   │   │   ├── ranking/             # ELO leaderboard
│   │   │   ├── achievements/        # Player achievements
│   │   │   ├── challenges/          # Challenge leaderboards
│   │   │   ├── events/              # Event management
│   │   │   ├── calendar/            # Calendar view
│   │   │   └── venues/              # Venue management and ratings
│   │   ├── match-share/             # Public match share page
│   │   └── ranking-share/           # Public ranking share page
│   ├── invite/[token]/              # Guest invite link handler
│   ├── rank/public/[token]/         # Public ranking view
│   └── api/
│       ├── og/                      # Open Graph image generation
│       └── partnerships/            # Partnership analytics endpoints
├── components/                      # Reusable UI components
├── lib/
│   ├── data.ts                      # Centralized data layer (all DB queries)
│   ├── supabase/                    # Supabase client factories (server/browser)
│   └── utils.ts                     # Shared utilities
├── types/                           # TypeScript type definitions
└── middleware.ts                     # Anonymous session enforcement
supabase/
├── migrations/                      # Ordered SQL migration files
└── seed.sql                         # Development seed data
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18.0 or higher
- npm or yarn package manager
- Supabase CLI (`npm install -g supabase`)
- A Supabase project (free tier works)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/fedegualdrini/padelapp.git
   cd padelapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create your local environment file
   cp .env.example .env.local

   # Edit .env.local and add your Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Set up the database**
   ```bash
   # Link to your Supabase project
   supabase link --project-ref your-project-ref

   # Apply all migrations and seed data
   supabase db reset
   ```

   Supabase setup checklist:
   - Enable **Anonymous Auth** (Dashboard → Auth → Providers → Anonymous)
   - Ensure `pgcrypto` is available (`create extension if not exists pgcrypto;`)

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to `http://localhost:3000`

   > **Default seed group**: slug `padel`, passphrase `padel`

### **Build for Production**
```bash
npm run build
npm start
```

## 📖 Usage Guide

### **Creating & Joining Groups**

1. **Create a group**: From the home page, enter a group name and set a passphrase
2. **Join a group**: Enter the group slug and passphrase, or use an invite link
3. **Share access**: Send the group slug + passphrase (or an invite link) to teammates

### **Recording Matches**

1. **Go to Matches** → **New Match**
2. **Select players**: Choose 4 players across 2 teams
3. **Enter set scores**: Input scores for each set (best-of-3 or best-of-5)
4. **Save**: ELO ratings update automatically for all players

### **Viewing Rankings**

- **Leaderboard**: Navigate to the Ranking page for current ELO standings
- **Trends**: Each player card shows ELO trend over recent matches
- **Public link**: Share a read-only ranking view with non-members via a token link

### **Player & Pair Analytics**

- **Player profiles**: View individual match history, ELO progression chart, and achievements
- **Pair stats**: Navigate to Pairs to see win rate and record for every player combination
- **Partnerships**: Deep-dive into specific two-player partnership metrics and history
- **Achievements**: Automatically awarded based on milestone thresholds (wins, streaks, etc.)

### **Venues**

1. **Go to Venues** within your group
2. **Add a venue**: Create a venue with name, address, surface type, and amenities
3. **Rate & review**: Submit multi-dimensional ratings (court quality, lighting, comfort, etc.)
4. **Analytics**: View aggregated ratings and top-rated venues for your group

## 🔧 Configuration

### **Environment Variables**

Create a `.env.local` file in the root directory:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

No other environment variables are required for core functionality.

### **Database Management**

```bash
# Apply all migrations (fresh setup or reset)
supabase db reset

# Apply pending migrations only
supabase db push

# Create a new migration
supabase migration new your-migration-name

# Refresh materialized views (ELO + stats)
supabase db query --query "select refresh_stats_views();"

# Recompute all ELO ratings
supabase db query --query "select recompute_all_elo();"
```

## 🧪 Testing

### **Run All Tests**
```bash
npm test
```

### **Unit Tests**
```bash
npm run test:unit
```

### **End-to-End Tests**
```bash
npm run test:e2e
```

### **Type Checking**
```bash
npm run typecheck
```

### **Linting**
```bash
npm run lint
```

## 🚀 Deployment

### **Deploy to Vercel**

#### **Method 1: Vercel Dashboard (Recommended)**

1. **Connect your GitHub repository**
   - Go to [vercel.com](https://vercel.com) and log in
   - Click **"New Project"**
   - Import your GitHub repository

2. **Set up Environment Variables**
   - In your Vercel project dashboard, go to **Settings** → **Environment Variables**
   - Add the following:
     - **Name**: `NEXT_PUBLIC_SUPABASE_URL` | **Value**: your Supabase project URL
     - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Value**: your Supabase anon key
   - Select all environments (Production, Preview, Development)
   - Click **Save**

3. **Deploy**
   - Vercel auto-detects Next.js and deploys with optimal settings
   - Your app will be available at `https://your-project-name.vercel.app`

#### **Method 2: Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

#### **Method 3: GitHub Integration (Auto-deploy)**

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com) → **New Project**
   - Select your GitHub repository
   - Configure environment variables in the setup wizard

3. **Auto-deploy**
   - Every push to `main` triggers a production deployment
   - Pull requests get automatic preview deployments

## 🤝 Contributing

### **Development Workflow**

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Add a migration if needed**: `supabase migration new feature-name`
4. **Make changes** and commit: `git commit -m 'feat: add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Create Pull Request**

### **Code Standards**

- **TypeScript**: Strict mode enabled — no `any` types
- **ESLint**: Run `npm run lint` before committing
- **Conventional Commits**: Use `feat:`, `fix:`, `docs:`, `chore:` prefixes
- **Server-first**: Prefer Server Components and server actions over client-side fetching
- **RLS**: All new tables must have Row Level Security policies

### **Testing Requirements**

- **Unit Tests**: Cover ELO calculation logic and data utilities
- **E2E Tests**: Cover critical flows (join group, create match, view rankings)

## 📊 Data Model Overview

### **Core Tables**
- `groups` / `group_members` / `group_admins` — Group management and membership
- `players` — Player profiles scoped to a group
- `matches` / `match_teams` / `match_team_players` / `sets` / `set_scores` — Full match recording
- `elo_ratings` — ELO history per player per match

### **Stats & Views**
- `mv_player_stats` — Materialized: player win rates
- `mv_pair_stats` / `mv_pair_aggregates` — Materialized: pair match history and win rates
- `materialized_partnerships` — Materialized: detailed partnership metrics

### **Extended Features**
- `achievement_definitions` / `achievements` — Achievement system
- `weekly_challenges` / `player_weekly_progress` / `streaks` — Challenge system
- `venues` / `venue_ratings` / `venue_analytics` — Venue management
- `tournaments` / `tournament_participants` / `tournament_standings` — Tournament system
- `rackets` / `match_rackets` — Racket performance tracking
- `public_ranking_shares` — Token-based public ranking links

## 🐛 Troubleshooting

### **Common Issues**

#### **"Invalid passphrase" when joining a group**
- Double-check the group slug and passphrase (both are case-sensitive)
- Confirm the group exists on the home page

#### **ELO ratings not updating after a match**
- Ensure all 4 players are selected and set scores are valid
- Check Supabase logs for any RLS policy violations
- Manually refresh: `select recompute_all_elo();`

#### **Supabase auth errors in local dev**
- Run `supabase db reset` to reset the local database
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` match your local Supabase instance
- Confirm Anonymous Auth is enabled in the Supabase Dashboard

#### **Build errors**
```bash
# Clear Next.js cache and rebuild
rm -rf .next
npm run build
```

#### **Database migration errors**
```bash
# Reset and reapply all migrations with seed data
supabase db reset

# Or check migration status
supabase migration list
```

## 📚 Additional Resources

### **Documentation**
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [SWR Data Fetching](https://swr.vercel.app/)

### **Tools**
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Lucide Icons](https://lucide.dev/)
- [Lightweight Charts](https://tradingview.github.io/lightweight-charts/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase**: For the incredible open-source backend-as-a-service platform
- **Vercel**: For seamless Next.js hosting and deployment
- **Lucide**: For the beautiful, consistent icon library
- **Tailwind CSS**: For the utility-first CSS framework that makes UI a joy

## 📞 Support

### **Issues & Questions**
- **GitHub Issues**: [Create an issue](https://github.com/fedegualdrini/padelapp/issues)
- **Discussions**: [Join discussions](https://github.com/fedegualdrini/padelapp/discussions)

### **Feature Requests**
- Open a GitHub Issue with the `enhancement` label
- Share ideas in [GitHub Discussions](https://github.com/fedegualdrini/padelapp/discussions)

---

**Made with ❤️ for padel players everywhere**

