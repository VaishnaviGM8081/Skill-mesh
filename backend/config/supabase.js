const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin;

function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for admin/storage/JWT verification');
  }
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabaseAdmin;
}

/**
 * Anon client for server-side OTP only (never sent to browsers).
 */
function getSupabaseAuthClient() {
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anon) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set for /api/auth OTP routes');
  }
  return createClient(supabaseUrl, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

module.exports = {
  getSupabaseAdmin,
  getSupabaseAuthClient,
};
