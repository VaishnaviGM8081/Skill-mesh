/**
 * Migrates workers, worker_ratings, worker_skills from a source Postgres (e.g. local Docker)
 * into Supabase: creates Auth users (phone) and inserts rows with supabase_uid.
 *
 * Env:
 *   SOURCE_DATABASE_URL — local postgres URL
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   TARGET_DATABASE_URL — Supabase Postgres connection string (Settings → Database)
 *
 * Run: node scripts/migrate-to-supabase.js
 */

const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SOURCE_URL = process.env.SOURCE_DATABASE_URL || process.env.LOCAL_DATABASE_URL;
const TARGET_URL = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SOURCE_URL || !TARGET_URL || !SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    'Missing env: SOURCE_DATABASE_URL (or LOCAL_DATABASE_URL), TARGET_DATABASE_URL (or DATABASE_URL), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const source = new Pool({ connectionString: SOURCE_URL });
const target = new Pool({
  connectionString: TARGET_URL,
  ssl: { rejectUnauthorized: false },
});
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { rows: workers } = await source.query(
    `SELECT id, name, phone, trade_category::text, years_experience,
            ST_X(location::geometry) AS lon, ST_Y(location::geometry) AS lat,
            availability_status, verification_level::text, created_at
     FROM workers ORDER BY id`
  );

  const oldToNewWorkerId = new Map();

  console.log(`Migrating ${workers.length} workers...`);

  for (const w of workers) {
    const phone = w.phone?.startsWith('+') ? w.phone : `+${w.phone}`.replace('++', '+');
    const { data: created, error } = await admin.auth.admin.createUser({
      phone,
      phone_confirm: true,
      user_metadata: { name: w.name },
    });

    if (error) {
      console.error(`Auth create failed for worker ${w.id} (${phone}):`, error.message);
      continue;
    }

    const uid = created.user.id;

    const lon = w.lon != null ? Number(w.lon) : null;
    const lat = w.lat != null ? Number(w.lat) : null;

    const ins = await target.query(
      `INSERT INTO workers (name, phone, trade_category, years_experience, location,
          availability_status, verification_level, created_at, supabase_uid)
       VALUES ($1, $2, $3::trade_category_enum, $4,
          CASE WHEN $5::float8 IS NULL OR $6::float8 IS NULL THEN NULL
               ELSE ST_SetSRID(ST_MakePoint($5, $6), 4326) END,
          $7, $8::verification_level_enum, $9, $10)
       RETURNING id`,
      [
        w.name,
        w.phone,
        w.trade_category,
        w.years_experience,
        lon,
        lat,
        w.availability_status,
        w.verification_level,
        w.created_at,
        uid,
      ]
    );

    const newId = ins.rows[0].id;
    oldToNewWorkerId.set(w.id, newId);
    console.log(`Worker ${w.id} -> ${newId}, uid ${uid}`);
  }

  const { rows: ratings } = await source.query(`SELECT * FROM worker_ratings ORDER BY id`);
  let ratingInserted = 0;
  for (const r of ratings) {
    const newWid = oldToNewWorkerId.get(r.worker_id);
    if (!newWid) continue;
    // customer_id / job_id are not remapped here; avoid FK errors on a fresh Supabase DB.
    await target.query(
      `INSERT INTO worker_ratings (worker_id, customer_id, job_id, rating, review_text, created_at)
       VALUES ($1, NULL, NULL, $2, $3, $4)`,
      [newWid, r.rating, r.review_text, r.created_at]
    );
    ratingInserted += 1;
  }
  console.log(`Migrated ${ratingInserted} ratings (customer/job FKs nulled; extend script if you remap customers/jobs).`);

  const { rows: skills } = await source.query(`SELECT * FROM worker_skills`);
  for (const s of skills) {
    const newWid = oldToNewWorkerId.get(s.worker_id);
    if (!newWid) continue;
    await target.query(
      `INSERT INTO worker_skills (worker_id, skill_name, peer_review_count, video_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (worker_id, skill_name) DO UPDATE SET
         peer_review_count = EXCLUDED.peer_review_count,
         video_url = EXCLUDED.video_url`,
      [newWid, s.skill_name, s.peer_review_count, s.video_url]
    );
  }
  console.log(`Migrated ${skills.length} skill rows.`);

  await source.end();
  await target.end();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
