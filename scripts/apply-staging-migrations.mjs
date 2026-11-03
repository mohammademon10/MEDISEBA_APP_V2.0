import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables safely
if (fs.existsSync(path.join(rootDir, '.env.staging'))) {
  dotenv.config({ path: path.join(rootDir, '.env.staging') });
} else if (fs.existsSync(path.join(rootDir, '.env.local'))) {
  dotenv.config({ path: path.join(rootDir, '.env.local') });
} else {
  dotenv.config({ path: path.join(rootDir, '.env') });
}

const rawDbUrl = process.env.MEDISEBA_STAGING_DATABASE_URL;
const isDryRun = process.argv.includes('--dry-run');
const shouldSeed = process.argv.includes('--seed');

if (!rawDbUrl) {
  console.error('\x1b[31m[ERROR]\x1b[0m Missing MEDISEBA_STAGING_DATABASE_URL environment variable.');
  console.error('Please configure MEDISEBA_STAGING_DATABASE_URL in .env.staging (gitignored).');
  process.exit(1);
}

let parsedUrl;
try {
  parsedUrl = new URL(rawDbUrl);
} catch {
  console.error('\x1b[31m[ERROR]\x1b[0m Invalid MEDISEBA_STAGING_DATABASE_URL format.');
  process.exit(1);
}

const maskedUser = parsedUrl.username ? parsedUrl.username.substring(0, 4) + '***' : 'unknown';
const maskedHost = parsedUrl.host || 'unknown';
const dbName = parsedUrl.pathname ? parsedUrl.pathname.replace('/', '') : 'postgres';

console.log('==============================================================================');
console.log('MediSeba V3 — Remote Staging Migration Runner (Safe & Transactional)');
console.log('==============================================================================');
console.log(`Target Host: ${maskedHost}`);
console.log(`Database:    ${dbName}`);
console.log(`User:        ${maskedUser}`);
console.log(`Mode:        ${isDryRun ? 'DRY RUN (Preview Only)' : 'EXECUTE MIGRATIONS'}`);
console.log('==============================================================================\n');

const client = new Client({
  connectionString: rawDbUrl,
  ssl: {
    rejectUnauthorized: false,
  },
  statement_timeout: 60000,
});

async function main() {
  try {
    await client.connect();
    console.log('[1/4] Connected to remote staging database successfully.');

    // 1. Ensure migration tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public._mediseba_migration_history (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Fetch already applied versions
    const appliedRes = await client.query('SELECT version FROM public._mediseba_migration_history ORDER BY version ASC');
    const appliedVersions = new Set(appliedRes.rows.map(r => r.version));

    // 3. Scan migrations directory
    const migrationsDir = path.join(rootDir, 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const pending = files.filter(f => !appliedVersions.has(f));

    console.log(`\n[2/4] Migration State Audit:`);
    console.log(`  Total Migration Files:    ${files.length}`);
    console.log(`  Already Applied:          ${appliedVersions.size}`);
    console.log(`  Pending Application:      ${pending.length}`);

    if (pending.length === 0) {
      console.log('\n\x1b[32m✔ Database is up to date. No pending migrations.\x1b[0m');
    } else {
      console.log('\nPending Migrations to Apply in Order:');
      pending.forEach((f, idx) => console.log(`  [${idx + 1}/${pending.length}] ${f}`));
    }

    if (isDryRun) {
      console.log('\n[Dry-Run Complete] No database changes were executed.');
      process.exit(0);
    }

    // 4. Apply pending migrations sequentially in transactions
    if (pending.length > 0) {
      console.log('\n[3/4] Applying Pending Migrations...');

      for (const migrationFile of pending) {
        const fullPath = path.join(migrationsDir, migrationFile);
        const sql = fs.readFileSync(fullPath, 'utf-8');

        console.log(`\nApplying: ${migrationFile} ...`);
        await client.query('BEGIN;');
        try {
          await client.query(sql);
          await client.query(
            'INSERT INTO public._mediseba_migration_history (version) VALUES ($1);',
            [migrationFile]
          );
          await client.query('COMMIT;');
          console.log(`  \x1b[32m✔\x1b[0m Successfully applied and recorded: ${migrationFile}`);
        } catch (migErr) {
          await client.query('ROLLBACK;');
          console.error(`\n\x1b[31m[FAILED]\x1b[0m Error applying migration ${migrationFile}:`);
          console.error(`  ${migErr.message}`);
          console.error('Transaction was rolled back. Halting migration sequence.');
          process.exit(1);
        }
      }
    }

    // 5. Optional Seed Data
    if (shouldSeed) {
      console.log('\n[4/4] Applying Synthetic Seed Data from supabase/seed.sql...');
      const seedPath = path.join(rootDir, 'supabase', 'seed.sql');
      if (fs.existsSync(seedPath)) {
        const seedSql = fs.readFileSync(seedPath, 'utf-8');
        await client.query('BEGIN;');
        try {
          await client.query(seedSql);
          await client.query('COMMIT;');
          console.log('  \x1b[32m✔\x1b[0m Synthetic seed data applied successfully.');
        } catch (seedErr) {
          await client.query('ROLLBACK;');
          console.error('\x1b[31m[SEED ERROR]\x1b[0m Failed applying seed data:');
          console.error(`  ${seedErr.message}`);
        }
      } else {
        console.warn('  \x1b[33m[WARNING]\x1b[0m supabase/seed.sql not found.');
      }
    } else {
      console.log('\n[4/4] Seed data application skipped (pass --seed to execute seed data).');
    }

    console.log('\n==============================================================================');
    console.log('\x1b[32mMIGRATION PROCESS COMPLETED SUCCESSFULLY\x1b[0m');
    console.log('==============================================================================');
  } catch (err) {
    console.error('\n\x1b[31m[FATAL ERROR]:\x1b[0m', err.message);
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch {
      // ignore close errors
    }
  }
}

main();
