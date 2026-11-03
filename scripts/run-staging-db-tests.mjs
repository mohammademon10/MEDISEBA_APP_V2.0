import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;

// Load environment variables from .env.staging or .env.local if present
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

if (fs.existsSync(path.join(rootDir, '.env.staging'))) {
  dotenv.config({ path: path.join(rootDir, '.env.staging') });
} else if (fs.existsSync(path.join(rootDir, '.env.local'))) {
  dotenv.config({ path: path.join(rootDir, '.env.local') });
} else {
  dotenv.config({ path: path.join(rootDir, '.env') });
}

const rawDbUrl = process.env.MEDISEBA_STAGING_DATABASE_URL;

if (!rawDbUrl) {
  console.error('\x1b[31m[ERROR]\x1b[0m Missing MEDISEBA_STAGING_DATABASE_URL environment variable.');
  console.error('Please set MEDISEBA_STAGING_DATABASE_URL in your environment or in .env.staging (gitignored).');
  console.error('Example: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require');
  process.exit(1);
}

// Parse connection URL safely without logging password
let parsedUrl;
try {
  parsedUrl = new URL(rawDbUrl);
} catch (err) {
  console.error('\x1b[31m[ERROR]\x1b[0m Invalid MEDISEBA_STAGING_DATABASE_URL format.');
  process.exit(1);
}

const maskedUser = parsedUrl.username ? parsedUrl.username.substring(0, 4) + '***' : 'unknown';
const maskedHost = parsedUrl.host || 'unknown';
const dbName = parsedUrl.pathname ? parsedUrl.pathname.replace('/', '') : 'postgres';

console.log('==============================================================================');
console.log('MediSeba V3 — Docker-Free Remote Staging Database Test Runner');
console.log('==============================================================================');
console.log(`Target Host: ${maskedHost}`);
console.log(`Database:    ${dbName}`);
console.log(`User:        ${maskedUser}`);
console.log(`SSL Mode:    ENFORCED (rejectUnauthorized: false for Supabase certificates)`);
console.log('==============================================================================\n');

// Configure PG client with SSL enforced
const client = new Client({
  connectionString: rawDbUrl,
  ssl: {
    rejectUnauthorized: false,
  },
  statement_timeout: 30000, // 30 second timeout per statement
});

/**
 * Parses TAP formatted output lines and counts results
 */
function parseTapOutput(lines) {
  let planned = 0;
  let passed = 0;
  let failed = 0;
  const failureDetails = [];

  for (const rawLine of lines) {
    const line = typeof rawLine === 'string' ? rawLine.trim() : '';
    if (!line) continue;

    // Detect plan: e.g. 1..13
    const planMatch = line.match(/^1\.\.(\d+)/);
    if (planMatch) {
      planned = parseInt(planMatch[1], 10);
      continue;
    }

    // Detect passing test: ok 1 - Description
    if (line.match(/^ok\s+\d+/i)) {
      passed++;
      console.log(`  \x1b[32m✔\x1b[0m ${line}`);
      continue;
    }

    // Detect failing test: not ok 1 - Description
    if (line.match(/^not ok\s+\d+/i)) {
      failed++;
      failureDetails.push(line);
      console.log(`  \x1b[31m✖\x1b[0m ${line}`);
      continue;
    }

    // Diagnostics / comments
    if (line.startsWith('#')) {
      console.log(`    \x1b[90m${line}\x1b[0m`);
    } else {
      console.log(`    ${line}`);
    }
  }

  return { planned, passed, failed, failureDetails };
}

/**
 * Main Test Execution Function
 */
async function main() {
  let overallFailed = 0;
  let overallPassed = 0;
  let overallPlanned = 0;

  try {
    console.log('[1/4] Establishing secure connection to staging database...');
    await client.connect();
    console.log('Connected successfully.\n');

    // Verify database identity and safety
    const idResult = await client.query('SELECT current_database(), current_user, version()');
    console.log(`[Staging Database Verified] DB: ${idResult.rows[0].current_database}, User: ${idResult.rows[0].current_user}`);

    // Check pgTAP extension
    console.log('\n[2/4] Verifying pgTAP extension on staging database...');
    const extCheck = await client.query("SELECT 1 FROM pg_extension WHERE extname = 'pgtap'");
    if (extCheck.rows.length === 0) {
      console.log('pgTAP extension is not currently enabled. Attempting to enable (CREATE EXTENSION IF NOT EXISTS pgtap)...');
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS pgtap;');
        console.log('Successfully enabled pgtap extension.\n');
      } catch (extErr) {
        console.error('\x1b[31m[ERROR]\x1b[0m Could not automatically enable pgtap extension:');
        console.error(`  ${extErr.message}`);
        console.error('\nPlease enable pgTAP manually on your Supabase staging project:');
        console.error('1. Open Supabase Dashboard -> Database -> Extensions');
        console.error('2. Search for "pgtap" and toggle it ON (or run "CREATE EXTENSION pgtap;" in SQL Editor).');
        process.exit(1);
      }
    } else {
      console.log('pgTAP extension is enabled.\n');
    }

    // Check table prerequisites
    console.log('[3/4] Verifying MediSeba schema prerequisites...');
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('profiles', 'doctors', 'patients', 'appointments', 'consents', 'record_access_logs')
    `);
    
    const existingTables = new Set(tablesCheck.rows.map(r => r.table_name));
    if (existingTables.size < 6) {
      console.warn('\x1b[33m[WARNING]\x1b[0m Some core tables appear to be missing from the public schema.');
      console.warn(`Found: ${Array.from(existingTables).join(', ') || 'none'}.`);
      console.warn('Ensure all 5 migrations and seed data have been applied before running the tests.\n');
    } else {
      console.log(`Core schema tables verified (${existingTables.size} tables found).\n`);
    }

    // Test suites to run
    const testFiles = [
      'supabase/tests/01_rls_security.sql',
      'supabase/tests/02_security_hardening.sql',
    ];

    console.log('[4/4] Executing pgTAP Test Suites...\n');

    for (const testRelPath of testFiles) {
      const fullPath = path.join(rootDir, testRelPath);
      if (!fs.existsSync(fullPath)) {
        console.error(`\x1b[31m[ERROR]\x1b[0m Test file not found: ${testRelPath}`);
        overallFailed++;
        continue;
      }

      console.log(`------------------------------------------------------------------------------`);
      console.log(`Running: ${testRelPath}`);
      console.log(`------------------------------------------------------------------------------`);

      const sqlContent = fs.readFileSync(fullPath, 'utf-8');

      // Execute SQL test script.
      // Notice: Each test script manages its own transaction (BEGIN ... ROLLBACK) and ends with ROLLBACK.
      // We also ensure RESET ROLE and RESET search_path after each file.
      try {
        const result = await client.query(sqlContent);

        // Result can be an array of query results if multiple statements were executed
        const outputLines = [];
        if (Array.isArray(result)) {
          for (const res of result) {
            for (const row of res.rows) {
              const val = Object.values(row)[0];
              if (val !== undefined && val !== null) {
                outputLines.push(String(val));
              }
            }
          }
        } else if (result && result.rows) {
          for (const row of result.rows) {
            const val = Object.values(row)[0];
            if (val !== undefined && val !== null) {
              outputLines.push(String(val));
            }
          }
        }

        const { planned, passed, failed, failureDetails } = parseTapOutput(outputLines);

        overallPlanned += planned;
        overallPassed += passed;
        overallFailed += failed;

        if (failed > 0) {
          console.log(`\n\x1b[31mSuite FAILED:\x1b[0m ${failed} assertion(s) failed in ${testRelPath}`);
        } else {
          console.log(`\n\x1b[32mSuite PASSED:\x1b[0m ${passed}/${planned || passed} assertions ok`);
        }
      } catch (sqlErr) {
        overallFailed++;
        console.error(`\x1b[31m[EXECUTION ERROR in ${testRelPath}]:\x1b[0m`);
        console.error(`  ${sqlErr.message}`);
        if (sqlErr.position) console.error(`  Position: ${sqlErr.position}`);
        if (sqlErr.detail) console.error(`  Detail: ${sqlErr.detail}`);
        if (sqlErr.hint) console.error(`  Hint: ${sqlErr.hint}`);
      } finally {
        // Guarantee clean session state between test suites
        try {
          await client.query('RESET ROLE;');
          await client.query('RESET ALL;');
        } catch {
          // ignore reset error if session was aborted
        }
      }

      console.log('');
    }

    // Final Report Summary
    console.log('==============================================================================');
    console.log('FINAL STAGING DATABASE TEST SUMMARY');
    console.log('==============================================================================');
    console.log(`Total Assertions Planned:  ${overallPlanned}`);
    console.log(`Total Assertions Passed:   \x1b[32m${overallPassed}\x1b[0m`);
    console.log(`Total Assertions Failed:   ${overallFailed > 0 ? `\x1b[31m${overallFailed}\x1b[0m` : '0'}`);
    console.log('==============================================================================');

    if (overallFailed > 0) {
      console.error('\n\x1b[31m[VERIFICATION FAILED]\x1b[0m Some database tests did not pass. Inspect outputs above.');
      process.exit(1);
    } else {
      console.log('\n\x1b[32m[VERIFICATION SUCCESSFUL]\x1b[0m All remote staging database security tests passed!');
      process.exit(0);
    }
  } catch (fatalErr) {
    console.error('\n\x1b[31m[FATAL ERROR]:\x1b[0m', fatalErr.message);
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
