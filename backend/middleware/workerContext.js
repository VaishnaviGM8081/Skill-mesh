const db = require('../config/db');
const { verifySupabaseJwt } = require('./auth');

async function requireWorker(req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM workers WHERE supabase_uid = $1', [req.user.id]);
    if (!rows.length) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Worker profile not found. Register in the worker app.',
      });
    }
    req.worker = rows[0];
    return next();
  } catch (e) {
    return res.status(500).json({ success: false, data: null, error: e.message });
  }
}

const verifyWorker = [verifySupabaseJwt, requireWorker];

module.exports = { requireWorker, verifyWorker };
