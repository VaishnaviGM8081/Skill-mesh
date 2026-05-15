/**
 * seed_all.js
 * Populates Supabase with realistic Bengaluru-based data for Workers, Customers, and Jobs.
 * 
 * Run: node scripts/seed_all.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOCATIONS = [
  { area: 'Koramangala', pincode: '560034' },
  { area: 'Indiranagar', pincode: '560038' },
  { area: 'HSR Layout', pincode: '560102' },
  { area: 'Whitefield', pincode: '560066' },
  { area: 'Jayanagar', pincode: '560041' }
];

const TRADES = ['plumber', 'electrician', 'carpenter', 'painter', 'ac_technician'];

async function seed() {
  console.log('🚀 Starting Master Seed (Supabase)...');

  // 1. SEED WORKERS
  console.log('\n👷 Seeding Workers...');
  const workersData = [
    { name: 'Ramesh Kumar', phone: '+919000000001', trade_category: 'plumber', average_rating: 4.8, pincode: '560034' },
    { name: 'Priya Sharma', phone: '+919000000002', trade_category: 'electrician', average_rating: 4.9, pincode: '560038' },
    { name: 'Suresh Babu', phone: '+919000000003', trade_category: 'carpenter', average_rating: 4.5, pincode: '560102' },
    { name: 'Anwar Pasha', phone: '+919000000004', trade_category: 'painter', average_rating: 4.2, pincode: '560066' },
    { name: 'Kiran Patel', phone: '+919000000005', trade_category: 'ac_technician', average_rating: 4.7, pincode: '560041' }
  ];

  const { data: insertedWorkers, error: wErr } = await supabase
    .from('workers')
    .upsert(workersData, { onConflict: 'phone' })
    .select();

  if (wErr) console.error('Error seeding workers:', wErr);
  else console.log(`  ✓ Seeded ${insertedWorkers.length} workers.`);

  // 2. SEED CUSTOMERS
  console.log('\n👤 Seeding Customers...');
  const customersData = [
    { name: 'Aditi Rao', phone: '+918000000001' },
    { name: 'Karthik S', phone: '+918000000002' },
    { name: 'Sneha Reddy', phone: '+918000000003' }
  ];

  const { data: insertedCustomers, error: cErr } = await supabase
    .from('customers')
    .upsert(customersData, { onConflict: 'phone' })
    .select();

  if (cErr) console.error('Error seeding customers:', cErr);
  else console.log(`  ✓ Seeded ${insertedCustomers.length} customers.`);

  // 3. SEED JOBS
  if (insertedWorkers && insertedCustomers) {
    console.log('\n🛠  Seeding Realistic Job Requests...');
    const jobsData = [
      {
        customer_id: insertedCustomers[0].id,
        worker_id: insertedWorkers[0].id,
        category: 'plumber',
        notes: 'Kitchen sink is leaking urgently since morning.',
        pincode: '560034',
        status: 'completed',
        budget: 450
      },
      {
        customer_id: insertedCustomers[1].id,
        worker_id: insertedWorkers[1].id,
        category: 'electrician',
        notes: 'Main switch board making spark noises. Need help.',
        pincode: '560038',
        status: 'in_progress',
        budget: 800
      },
      {
        customer_id: insertedCustomers[2].id,
        category: 'carpenter',
        notes: 'Need to fix a broken wooden chair and door hinge.',
        pincode: '560102',
        status: 'pending',
        budget: 1200
      }
    ];

    const { error: jErr } = await supabase.from('jobs').insert(jobsData);
    if (jErr) console.error('Error seeding jobs:', jErr);
    else console.log('  ✓ Seeded realistic job requests.');
  }

  console.log('\n🎉 Master Seed Complete! Refresh your Admin Dashboard to see changes.');
  process.exit(0);
}

seed();
