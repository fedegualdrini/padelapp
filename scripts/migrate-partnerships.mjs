import pg from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'supabase', 'migrations');

// Specific migration files to apply
const MIGRATION_FILES = [
  '20260130_130827_partnership_materialized_view.sql',
  '20260130_130828_partnership_refresh_trigger.sql',
  '20260130_130829_partnership_rpc_functions.sql',
];

async function readSql(filePath) {
  const buf = await fs.readFile(filePath);
  // Strip UTF-8 BOM if present
  const text = buf.toString('utf8').replace(/^\uFEFF/, '');
  return text;
}

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('Missing DATABASE_URL environment variable');
    process.exit(1);
  }

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    console.log('[migrate-partnerships] Connected to database');

    for (const file of MIGRATION_FILES) {
      const fullPath = path.join(MIGRATIONS_DIR, file);
      console.log(`[migrate-partnerships] Applying ${file}...`);

      const sql = await readSql(fullPath);
      if (!sql.trim()) {
        console.log(`[migrate-partnerships] Skipping ${file} (empty)`);
        continue;
      }

      await client.query(sql);
      console.log(`[migrate-partnerships] ✓ ${file} applied`);
    }

    console.log('[migrate-partnerships] All migrations applied successfully');
  } catch (err) {
    console.error('[migrate-partnerships] FAILED:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[migrate-partnerships] Fatal error');
  process.exit(1);
});
