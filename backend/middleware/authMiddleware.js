const { supabase } = require('../config/supabase');

// Known DEV test tokens (short UUID format) — bypassed without Supabase call
const TEST_WORKER_UID   = 'e6d6bd85-afc2-4874-bca7-2c32d98086eb';
const TEST_CUSTOMER_UID = '0ba38fa3-1ab4-405e-884d-1c43d3721680';
const DEV_WORKER_UID    = '11111111-1111-1111-1111-111111111111'; // Worker App dev token

const DEV_TOKENS = new Set([TEST_WORKER_UID, TEST_CUSTOMER_UID, DEV_WORKER_UID]);

// A real Supabase JWT is much longer than a UUID (>100 chars)
const isRealJwt = (token) => token && token.length > 50 && token.includes('.');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  // ── Real Supabase JWT: verify with Supabase ──────────────────────────────
  if (isRealJwt(token)) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      req.user = user;
      return next();
    } catch (err) {
      console.error('Auth middleware error:', err);
      return res.status(500).json({ error: 'Internal server error during authentication' });
    }
  }

  // ── DEV short-UUID tokens: map to known test users ───────────────────────
  if (DEV_TOKENS.has(token)) {
    req.user = { id: token }; // Maps '1111...' directly to Arjun Mehta instead of forcing it to Siri
    return next();
  }

  // ── Unknown token in DEV_MODE — still allow, default to worker ───────────
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[AUTH] Unknown token "${token.slice(0, 12)}..." — defaulting to TEST_WORKER_UID`);
    req.user = { id: TEST_WORKER_UID };
    return next();
  }

  return res.status(401).json({ error: 'Invalid token' });
};

module.exports = authMiddleware;
