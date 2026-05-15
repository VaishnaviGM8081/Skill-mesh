/**
 * update_schema_photos.js
 * Adds photo-related columns to 'jobs' and 'workers' tables in Supabase.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateSchema() {
  console.log('🔧 Updating Database Schema for Photos & KYC...');

  // Note: Since we can't run raw ALTER TABLE through the JS client easily without a special RPC,
  // we will attempt to insert a dummy record with these fields to see if they exist, 
  // but the best way is usually the Supabase SQL Editor.
  // HOWEVER, I will provide the SQL for you to run in the Supabase Dashboard as well.

  console.log('\n📝 Please run this SQL in your Supabase SQL Editor for best results:');
  console.log(`
    -- Add Photo Columns to Jobs
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS problem_photo_url TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completion_photo_url TEXT;

    -- Add KYC Columns to Workers
    ALTER TABLE workers ADD COLUMN IF NOT EXISTS id_card_url TEXT;
    ALTER TABLE workers ADD COLUMN IF NOT EXISTS certificate_url TEXT;
    ALTER TABLE workers ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
  `);

  console.log('\n✅ Schema update instructions generated. Please apply the SQL above in your Supabase Dashboard.');
  process.exit(0);
}

updateSchema();
