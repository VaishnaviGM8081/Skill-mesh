const { supabase } = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
  // TEMP DEV AUTH BYPASS
  const DEV_MODE = true;
  const TEST_WORKER_UID = "e6d6bd85-afc2-4874-bca7-2c32d98086eb";
  const TEST_CUSTOMER_UID = "0ba38fa3-1ab4-405e-884d-1c43d3721680";

  if (DEV_MODE) {
    // Identify user based on route or token if present
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : null;

    if (token === TEST_CUSTOMER_UID || req.originalUrl.includes('/api/customers')) {
      req.user = { id: TEST_CUSTOMER_UID };
    } else {
      req.user = { id: TEST_WORKER_UID };
    }
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(' ')[1] : null;

  if (!authHeader || !token) {
    return res.status(401).json({ error: 'No authorization header or token provided' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

module.exports = authMiddleware;
