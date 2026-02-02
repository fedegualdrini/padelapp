#!/usr/bin/env node
/**
 * Run the three 20260202_* migrations against a remote Supabase DB.
 * Usage: SUPABASE_DB_PASSWORD=yourpass node scripts/push-remote-migrations.mjs
 */

import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const migrationsDir = join(rootDir, "supabase", "migrations");
const scriptsDir = join(rootDir, "scripts");

// Order: ensure tables exist, then our RLS fixes. (event_occurrences already applied.)
const migrations = [
  { path: join(scriptsDir, "remote-migrations-minimal-rackets.sql"), name: "minimal-rackets (tables)" },
  { path: join(migrationsDir, "20260202_000002_rackets_rls_group_members.sql"), name: "20260202_000002_rackets_rls_group_members.sql" },
  { path: join(scriptsDir, "remote-migrations-minimal-venues.sql"), name: "minimal-venues (table)" },
  { path: join(migrationsDir, "20260202_000003_venues_rls_group_members.sql"), name: "20260202_000003_venues_rls_group_members.sql" },
];

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error("Set SUPABASE_DB_PASSWORD and run again.");
  process.exit(1);
}

const connectionString = `postgresql://postgres.ivksdrsfmtitavmhfkzd:${encodeURIComponent(password)}@aws-1-us-east-2.pooler.supabase.com:6543/postgres`;

const client = new pg.Client({ connectionString });

async function run() {
  try {
    await client.connect();
    console.log("Connected to remote database.\n");

    for (const { path: filePath, name } of migrations) {
      const sql = readFileSync(filePath, "utf8");
      console.log(`Applying ${name}...`);
      await client.query(sql);
      console.log(`  OK\n`);
    }

    console.log("All migrations applied successfully.");
  } catch (err) {
    console.error("Error:", err.message);
    if (err.position) console.error("Position:", err.position);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
