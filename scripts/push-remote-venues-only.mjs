#!/usr/bin/env node
/** Run only minimal-venues + venues RLS. Use when rackets are already applied. */
import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const scriptsDir = join(rootDir, "scripts");
const migrationsDir = join(rootDir, "supabase", "migrations");

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error("Set SUPABASE_DB_PASSWORD and run again.");
  process.exit(1);
}

const connectionString = `postgresql://postgres.ivksdrsfmtitavmhfkzd:${encodeURIComponent(password)}@aws-1-us-east-2.pooler.supabase.com:6543/postgres`;
const client = new pg.Client({ connectionString });

const steps = [
  { path: join(scriptsDir, "remote-migrations-minimal-venues.sql"), name: "minimal-venues (table)" },
  { path: join(migrationsDir, "20260202_000003_venues_rls_group_members.sql"), name: "20260202_000003_venues_rls_group_members.sql" },
];

async function run() {
  try {
    await client.connect();
    console.log("Connected to remote database.\n");
    for (const { path: filePath, name } of steps) {
      const sql = readFileSync(filePath, "utf8");
      console.log(`Applying ${name}...`);
      await client.query(sql);
      console.log(`  OK\n`);
    }
    console.log("Venues migrations applied successfully.");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
