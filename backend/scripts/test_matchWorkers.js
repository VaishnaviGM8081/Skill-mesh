const db = require('../config/db');
const { matchWorkers } = require('../utils/matchWorkers');

async function testMatchWorkers() {
  try {
    console.log('1. Setting up database columns...');
    await db.query(`
      ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS trust_score numeric DEFAULT 0.5;
      ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS latitude numeric;
      ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS longitude numeric;
      ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS skill_category VARCHAR(255);
      ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);
    `);

    console.log('2. Inserting test workers...');
    // Clean up old tests
    await db.query(`DELETE FROM public.workers WHERE phone LIKE 'TEST_%'`);

    // Insert dummy workers
    await db.query(`
      INSERT INTO public.workers (name, phone, trade_category, skill_category, latitude, longitude, availability_status, trust_score, pincode)
      VALUES 
      ('Test Worker 1', 'TEST_001', 'electrician', 'Electrician', 12.971, 77.594, true, 0.9, '560001'), -- Exact match, close
      ('Test Worker 2', 'TEST_002', 'plumber', 'Plumber', 12.975, 77.590, true, 0.8, '560001'), -- Wrong skill, close
      ('Test Worker 3', 'TEST_003', 'electrician', 'Electrician', 13.0, 77.6, true, 0.9, '560002'), -- Exact match, further away
      ('Test Worker 4', 'TEST_004', 'electrician', 'Electrician', 12.972, 77.595, false, 0.9, '560001'), -- Exact match, close, NOT AVAILABLE
      ('Test Worker 5', 'TEST_005', 'electrician', 'Electrician', null, null, true, 0.7, '560003') -- No lat/lon, only pincode
    `);

    console.log('3. Running matching...');
    // Customer looking for Electrician near (12.97, 77.59)
    const matches = await matchWorkers(12.97, 77.59, 'Electrician', '560001');

    console.log('-----------------------------------');
    console.log('MATCHING RESULTS:');
    console.log(JSON.stringify(matches, null, 2));
    console.log('-----------------------------------');

    console.log('4. Cleaning up test data...');
    await db.query(`DELETE FROM public.workers WHERE phone LIKE 'TEST_%'`);
    console.log('Done!');
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    process.exit(0);
  }
}

testMatchWorkers();
