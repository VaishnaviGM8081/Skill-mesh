const express = require('express');
const db = require('../config/db');
const { verifySupabaseJwt } = require('../middleware/auth');
const authMiddleware = require('../middleware/authMiddleware');
const { getSupabaseAdmin } = require('../config/supabase');

const router = express.Router();

// POST /api/customers/ensure — auto-create customer on first booking
router.post('/ensure', authMiddleware, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const uid = req.user.id;
    const phone = req.body.phone || 'unknown';

    const { data: existing } = await supabase
      .from('customers').select('id').eq('supabase_uid', uid).maybeSingle();

    if (!existing) {
      await supabase.from('customers').insert({ supabase_uid: uid, name: 'Customer', phone });
    }
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(200).json({ success: true }); // non-fatal, always proceed
  }
});

router.post('/register', verifySupabaseJwt, async (req, res) => {
  const { name, latitude, longitude } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, data: null, error: 'name is required' });
  }

  const phone = req.body.phone || req.user.phone || req.user.user_metadata?.phone;
  if (!phone) {
    return res.status(400).json({ success: false, data: null, error: 'phone is required' });
  }

  try {
    const existing = await db.query('SELECT id FROM customers WHERE supabase_uid = $1', [req.user.id]);
    if (existing.rows.length) {
      return res.status(409).json({ success: false, data: null, error: 'Customer already registered' });
    }

    let query;
    let params;
    if (latitude != null && longitude != null) {
      query = `INSERT INTO customers (name, phone, location, supabase_uid)
               VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5)
               RETURNING id, name, phone, supabase_uid`;
      params = [name, phone, longitude, latitude, req.user.id];
    } else {
      query = `INSERT INTO customers (name, phone, supabase_uid)
               VALUES ($1, $2, $3)
               RETURNING id, name, phone, supabase_uid`;
      params = [name, phone, req.user.id];
    }

    const result = await db.query(query, params);
    return res.status(201).json({ success: true, data: result.rows[0], error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
});

/** Current customer row for this JWT */
router.get('/me', verifySupabaseJwt, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM customers WHERE supabase_uid = $1', [req.user.id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, data: null, error: 'Customer profile not found' });
    }
    return res.json({ success: true, data: rows[0], error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
});

module.exports = router;
