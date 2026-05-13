const db = require('../config/db');
const { verifySupabaseJwt } = require('./auth');

/**
 * After JWT verification, loads customer row by supabase_uid into req.customer
 */
async function requireCustomer(req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM customers WHERE supabase_uid = $1', [req.user.id]);
    if (!rows.length) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Customer profile not found. Complete registration in the customer app.',
      });
    }
    req.customer = rows[0];
    return next();
  } catch (e) {
    return res.status(500).json({ success: false, data: null, error: e.message });
  }
}

const verifyCustomer = [verifySupabaseJwt, requireCustomer];

module.exports = { requireCustomer, verifyCustomer };
