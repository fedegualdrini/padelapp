import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'supabase', 'migrations');
const SEED_PATH = path.join(PROJECT_ROOT, 'supabase', 'seed.sql');

function die(msg) {
  console.error(`\n[db-reset] ${msg}\n`);
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
const ALLOW_RESET = process.env.TEST_DB_ALLOW_RESET === 'true';

if (!DATABASE_URL) {
  die(
    'Missing DATABASE_URL. Set DATABASE_URL to your *test* Postgres/Supabase database connection string.\n' +
      'Refusing to run without it.'
  );
}

if (!ALLOW_RESET) {
  die(
    'Refusing to reset database without TEST_DB_ALLOW_RESET=true.\n' +
      'This script DROPS and recreates the public schema.'
  );
}

async function readSql(filePath) {
  const buf = await fs.readFile(filePath);
  // Strip UTF-8 BOM if present
  const text = buf.toString('utf8').replace(/^\uFEFF/, '');
  return text;
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    console.log('[db-reset] connected');

    // Hard reset only the public schema; keep other schemas (auth, storage, etc.) intact.
    console.log('[db-reset] dropping schema public cascade');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await client.query('CREATE SCHEMA public;');

    // Common defaults
    await client.query('GRANT ALL ON SCHEMA public TO postgres;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');

    const migrationFiles = (await fs.readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`[db-reset] applying ${migrationFiles.length} migrations`);

    for (const file of migrationFiles) {
      const fullPath = path.join(MIGRATIONS_DIR, file);
      const sql = await readSql(fullPath);
      if (!sql.trim()) continue;
      console.log(`[db-reset] -> ${file}`);
      await client.query(sql);
    }

    const seedSql = await readSql(SEED_PATH);
    if (seedSql.trim()) {
      console.log('[db-reset] applying seed.sql');
      await client.query(seedSql);
    }

    console.log('[db-reset] done');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('\n[db-reset] FAILED');
  console.error(err);
  process.exit(1);
});
