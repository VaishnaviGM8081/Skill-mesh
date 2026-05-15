/**
 * seed_workers.js
 * Wipes previous seed workers and re-inserts 15 realistic workers with
 * genuinely varied ratings, trust scores, experience, and skills.
 * Also patches the DEV test worker so the Worker App shows real data.
 *
 * Run: node scripts/seed_workers.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// ── Bengaluru areas ───────────────────────────────────────────────────────────
const LOCATIONS = [
  { area: 'Koramangala',    pincode: '560034', lat: 12.9352, lng: 77.6245 },
  { area: 'BTM Layout',     pincode: '560076', lat: 12.9166, lng: 77.6101 },
  { area: 'HSR Layout',     pincode: '560102', lat: 12.9121, lng: 77.6446 },
  { area: 'Indiranagar',    pincode: '560038', lat: 12.9719, lng: 77.6412 },
  { area: 'Whitefield',     pincode: '560066', lat: 12.9698, lng: 77.7499 },
  { area: 'Jayanagar',      pincode: '560041', lat: 12.9308, lng: 77.5900 },
  { area: 'Marathahalli',   pincode: '560037', lat: 12.9591, lng: 77.6974 },
  { area: 'Malleswaram',    pincode: '560003', lat: 13.0035, lng: 77.5710 },
  { area: 'Rajajinagar',    pincode: '560010', lat: 12.9899, lng: 77.5541 },
  { area: 'Electronic City',pincode: '560100', lat: 12.8458, lng: 77.6603 },
  { area: 'Kengeri',        pincode: '560059', lat: 12.9246, lng: 77.5008 },
];

// ── Seed phones (for idempotent cleanup) ─────────────────────────────────────
const SEED_PHONES = [
  '+919845012301','+919845012302','+919845012303','+919845012304','+919845012305',
  '+919845012306','+919845012307','+919845012308','+919845012309','+919845012310',
  '+919845012311','+919845012312','+919845012313','+919845012314','+919845012315',
];

// ── 15 realistic, genuinely varied workers ────────────────────────────────────
// Ratings range from 2.8 (new/struggling) to 4.9 (veteran)
// Trust score 0-100, years experience 1-16
const WORKERS = [
  {
    name: 'Rajesh Kumar',       phone: SEED_PHONES[0],
    trade_category: 'plumber',  years_experience: 8,
    average_rating: 4.7,        trust_score: 82,  total_jobs: 134,
    location_idx: 10,
    skills: ['Pipe Fitting', 'Leak Repair', 'Bathroom Fixtures', 'Water Heater Install'],
    bio: 'Expert plumber with 8+ years in residential and commercial projects.',
  },
  {
    name: 'Suresh Babu',        phone: SEED_PHONES[1],
    trade_category: 'electrician', years_experience: 12,
    average_rating: 4.9,        trust_score: 95,  total_jobs: 276,
    location_idx: 10,
    skills: ['Wiring', 'Panel Box Repair', 'Fan Installation', 'CCTV Setup'],
    bio: 'Senior electrician trusted by 200+ households in BTM and HSR.',
  },
  {
    name: 'Mahesh Reddy',       phone: SEED_PHONES[2],
    trade_category: 'carpenter', years_experience: 3,
    average_rating: 3.8,        trust_score: 45,  total_jobs: 28,
    location_idx: 2,
    skills: ['Furniture Assembly', 'Door Fitting', 'Basic Wood Work'],
    bio: 'New to the platform but eager and punctual.',
  },
  {
    name: 'Anand Sharma',       phone: SEED_PHONES[3],
    trade_category: 'painter',  years_experience: 5,
    average_rating: 4.2,        trust_score: 63,  total_jobs: 89,
    location_idx: 3,
    skills: ['Interior Painting', 'Texture Finish', 'Wall Putty', 'Waterproofing'],
    bio: 'Clean work, reliable timelines. Specialises in premium finishes.',
  },
  {
    name: 'Venkatesh Naidu',    phone: SEED_PHONES[4],
    trade_category: 'ac_technician', years_experience: 9,
    average_rating: 4.8,        trust_score: 88,  total_jobs: 192,
    location_idx: 4,
    skills: ['AC Installation', 'Gas Refilling', 'Split AC Service', 'Window AC Repair'],
    bio: 'Certified AC technician, all major brands serviced.',
  },
  {
    name: 'Pradeep Gowda',      phone: SEED_PHONES[5],
    trade_category: 'plumber',  years_experience: 1,
    average_rating: 2.9,        trust_score: 22,  total_jobs: 7,
    location_idx: 5,
    skills: ['Tap Replacement', 'Drainage Cleaning'],
    bio: 'New worker, building reputation. Offers discounted rates.',
  },
  {
    name: 'Ramesh Yadav',       phone: SEED_PHONES[6],
    trade_category: 'electrician', years_experience: 7,
    average_rating: 4.5,        trust_score: 74,  total_jobs: 117,
    location_idx: 6,
    skills: ['Switchboard Repair', 'Light Fixtures', 'Inverter Setup', 'Earthing'],
    bio: 'Reliable electrician for homes and small offices.',
  },
  {
    name: 'Kiran Patil',        phone: SEED_PHONES[7],
    trade_category: 'cleaner',  years_experience: 4,
    average_rating: 4.1,        trust_score: 58,  total_jobs: 63,
    location_idx: 7,
    skills: ['Deep Cleaning', 'Sofa Cleaning', 'Kitchen Degreasing', 'Bathroom Sanitization'],
    bio: 'Uses eco-friendly products, pet-safe cleaning methods.',
  },
  {
    name: 'Sanjay Verma',       phone: SEED_PHONES[8],
    trade_category: 'carpenter', years_experience: 10,
    average_rating: 4.8,        trust_score: 91,  total_jobs: 205,
    location_idx: 8,
    skills: ['Modular Kitchen', 'Custom Furniture', 'Wood Polish', 'Sliding Doors'],
    bio: 'Master carpenter with showroom-quality finishes.',
  },
  {
    name: 'Arun Murthy',        phone: SEED_PHONES[9],
    trade_category: 'painter',  years_experience: 2,
    average_rating: 3.4,        trust_score: 37,  total_jobs: 19,
    location_idx: 9,
    skills: ['Interior Painting', 'Ceiling Paint'],
    bio: 'Budget-friendly painter, still learning premium techniques.',
  },
  {
    name: 'Deepak Nair',        phone: SEED_PHONES[10],
    trade_category: 'ac_technician', years_experience: 5,
    average_rating: 4.0,        trust_score: 60,  total_jobs: 74,
    location_idx: 0,
    skills: ['AC Cleaning', 'PCB Repair', 'Cassette AC', 'Ducted AC Service'],
    bio: 'Handles all AC models, quick turnaround.',
  },
  {
    name: 'Mohan Das',          phone: SEED_PHONES[11],
    trade_category: 'gardener', years_experience: 6,
    average_rating: 4.6,        trust_score: 72,  total_jobs: 98,
    location_idx: 1,
    skills: ['Lawn Mowing', 'Hedge Trimming', 'Plant Care', 'Terrace Garden Setup'],
    bio: 'Passionate gardener, transforms any outdoor space.',
  },
  {
    name: 'Naveen Shetty',      phone: SEED_PHONES[12],
    trade_category: 'electrician', years_experience: 16,
    average_rating: 4.9,        trust_score: 97,  total_jobs: 389,
    location_idx: 2,
    skills: ['Industrial Wiring', 'Transformer Maintenance', 'Solar Panel Install', 'Generator Setup'],
    bio: 'Top-rated electrician in Bengaluru with 16 years experience.',
  },
  {
    name: 'Girish Kamath',      phone: SEED_PHONES[13],
    trade_category: 'cook',     years_experience: 7,
    average_rating: 4.7,        trust_score: 83,  total_jobs: 152,
    location_idx: 3,
    skills: ['South Indian', 'North Indian Thali', 'Party Catering', 'Tiffin Service'],
    bio: 'Professional home cook, hygiene certified, 150+ happy clients.',
  },
  {
    name: 'Ravi Shankar',       phone: SEED_PHONES[14],
    trade_category: 'plumber',  years_experience: 11,
    average_rating: 4.3,        trust_score: 69,  total_jobs: 143,
    location_idx: 4,
    skills: ['CPVC Plumbing', 'Overhead Tank Repair', 'Borewell Pump', 'Water Purifier Install'],
    bio: 'Experienced plumber, specialises in underground piping.',
  },
];

// ── DEV test worker profile update ───────────────────────────────────────────
// supabase_uid matches TEST_WORKER_UID in App.js
const DEV_TEST_UID = '11111111-1111-1111-1111-111111111111';
const DEV_WORKER_UPDATE = {
  name: 'Arjun Mehta',
  trade_category: 'electrician',
  years_experience: 6,
  average_rating: 5.0,
  trust_score: 100,
  pincode: '560059',
  availability_status: true,
  payment_preference: 'upi',
};
const DEV_WORKER_SKILLS = [
  'Home Wiring', 'Panel Repair', 'Fan & AC Point', 'MCB Installation',
];

// ── Run seed ──────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Starting realistic worker seed...\n');

  // Step 1: Delete previous seed workers by phone
  console.log('🗑  Cleaning up previous seed data...');
  const { error: delErr } = await supabase
    .from('workers')
    .delete()
    .in('phone', SEED_PHONES);
  if (delErr) console.warn('  Cleanup warning:', delErr.message);
  else console.log('  ✓ Previous seed workers removed.\n');

  // Step 2: Insert fresh workers
  let created = 0, failed = 0;
  for (const w of WORKERS) {
    const loc = LOCATIONS[w.location_idx];

    const { data: worker, error: wErr } = await supabase
      .from('workers')
      .insert({
        name: w.name,
        phone: w.phone,
        trade_category: w.trade_category,
        years_experience: w.years_experience,
        average_rating: w.average_rating,
        trust_score: w.trust_score,
        completed_jobs: w.total_jobs || 0,
        verification_level: 'unverified',
        availability_status: true,
        pincode: loc.pincode,
        payment_preference: 'upi',
      })
      .select('id')
      .single();

    if (wErr) {
      console.error(`❌ Failed   ${w.name}: ${wErr.message}`);
      failed++;
      continue;
    }

    // Insert skills
    if (w.skills.length > 0) {
      await supabase.from('worker_skills').insert(
        w.skills.map(skill_name => ({ worker_id: worker.id, skill_name }))
      );
    }

    const stars = '⭐'.repeat(Math.round(w.average_rating));
    console.log(
      `✅ ${w.name.padEnd(22)} | ${w.trade_category.padEnd(14)} | ${loc.area.padEnd(16)} | ${w.average_rating.toFixed(1)}★ | ${w.total_jobs} jobs | Trust ${w.trust_score}`
    );
    created++;
  }

  // Step 3: Update DEV test worker (the one in the Worker App)
  console.log('\n🔧 Updating DEV test worker (Worker App profile)...');
  const { data: devWorker } = await supabase
    .from('workers')
    .select('id')
    .eq('supabase_uid', DEV_TEST_UID)
    .maybeSingle();

  if (devWorker) {
    await supabase.from('workers').update({
      ...DEV_WORKER_UPDATE,
    }).eq('id', devWorker.id);

    // Replace skills
    await supabase.from('worker_skills').delete().eq('worker_id', devWorker.id);
    await supabase.from('worker_skills').insert(
      DEV_WORKER_SKILLS.map(skill_name => ({ worker_id: devWorker.id, skill_name }))
    );
    console.log(`  ✓ DEV worker updated → ${DEV_WORKER_UPDATE.name} | ${DEV_WORKER_UPDATE.average_rating}★ | Trust ${DEV_WORKER_UPDATE.trust_score}`);
  } else {
    console.log('  ℹ  DEV worker not found (run the Worker App onboarding first to create it).');
  }

  console.log(`\n🎉 Done! ${created} workers created, ${failed} failed.`);
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
