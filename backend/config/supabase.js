const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
}

// Primary client using Anon Key — used by all controllers and authMiddleware
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let supabaseAdmin;

/**
 * Returns the admin client using the service role key.
 * Falls back to the anon client if the service role key is missing or truncated,
 * so the server still starts and basic auth/profile operations still work.
 */
function getSupabaseAdmin() {
  if (serviceRoleKey && serviceRoleKey.length > 100) {
    if (!supabaseAdmin) {
      supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return supabaseAdmin;
  }
  // Service key is missing or truncated — fall back to anon client
  return supabase;
}

/**
 * Anon client for server-side OTP flows.
 */
function getSupabaseAuthClient() {
  return supabase;
}

module.exports = {
  supabase,
  getSupabaseAdmin,
  getSupabaseAuthClient,
};
