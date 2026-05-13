const { getSupabaseAdmin } = require('../config/supabase');

/**
 * Verifies Supabase access_token from Authorization: Bearer <jwt>
 * Attaches Supabase user to req.user
 */
async function verifySupabaseJwt(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, data: null, error: 'Missing or invalid Authorization header' });
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ success: false, data: null, error: 'Missing bearer token' });
  }

  try {
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ success: false, data: null, error: error?.message || 'Invalid token' });
    }
    req.user = data.user;
    return next();
  } catch (e) {
    return res.status(401).json({ success: false, data: null, error: e.message || 'Auth failed' });
  }
}

module.exports = { verifySupabaseJwt };
