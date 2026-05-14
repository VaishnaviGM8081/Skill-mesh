const express = require('express');
const multer = require('multer');
const db = require('../config/db');
const redisClient = require('../config/redisClient');
const { getSupabaseAdmin } = require('../config/supabase');
const { verifySupabaseJwt } = require('../middleware/auth');
const { verifyCustomer } = require('../middleware/customerContext');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024 },
});

function sanitizeSkillFileName(skillName) {
  return String(skillName || 'skill')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .slice(0, 80) || 'skill';
}

async function getWorkerBySupabaseUid(uid) {
  const { rows } = await db.query('SELECT * FROM workers WHERE supabase_uid = $1', [uid]);
  return rows[0] || null;
}

async function assertWorkerOwnsParamId(req, res, workerIdParam) {
  const wid = Number(workerIdParam);
  if (!Number.isFinite(wid)) {
    res.status(400).json({ success: false, data: null, error: 'Invalid worker id' });
    return false;
  }
  const row = await getWorkerBySupabaseUid(req.user.id);
  if (!row || row.id !== wid) {
    res.status(403).json({ success: false, data: null, error: 'Forbidden' });
    return false;
  }
  return true;
}

/** Current worker profile for this JWT (404 if not registered yet) */
router.get('/me', verifySupabaseJwt, async (req, res) => {
  try {
    const row = await getWorkerBySupabaseUid(req.user.id);
    if (!row) {
      return res.status(404).json({ success: false, data: null, error: 'Worker profile not found' });
    }
    return res.json({ success: true, data: row, error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
});

router.post('/register', verifySupabaseJwt, async (req, res) => {
  const { name, phone, trade_category, latitude, longitude } = req.body;
  if (!name || !trade_category || latitude == null || longitude == null) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'name, trade_category, latitude, longitude are required',
    });
  }

  const phoneValue = phone || req.user.phone || req.user.user_metadata?.phone;
  if (!phoneValue) {
    return res.status(400).json({ success: false, data: null, error: 'phone is required (body or auth user)' });
  }

  try {
    const existing = await getWorkerBySupabaseUid(req.user.id);
    if (existing) {
      return res.status(409).json({ success: false, data: null, error: 'Worker already registered' });
    }

    const result = await db.query(
      `INSERT INTO workers (name, phone, trade_category, location, supabase_uid)
       VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6)
       RETURNING id, name, trade_category, verification_level, supabase_uid`,
      [name, phoneValue, trade_category, longitude, latitude, req.user.id]
    );
    return res.status(201).json({ success: true, data: result.rows[0], error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
});

router.get('/:id/profile', verifySupabaseJwt, async (req, res) => {
  const workerId = req.params.id;
  try {
    if (!(await assertWorkerOwnsParamId(req, res, workerId))) return;

    const workerRes = await db.query(
      `SELECT id, name, phone, trade_category, verification_level, availability_status, created_at, supabase_uid,
              ST_AsGeoJSON(location) as location
       FROM workers WHERE id = $1`,
      [workerId]
    );

    if (workerRes.rows.length === 0) {
      return res.status(404).json({ success: false, data: null, error: 'Worker not found' });
    }

    const ratingsRes = await db.query(
      `SELECT AVG(rating)::numeric(10,1) as avg_rating, COUNT(*)::int as total_jobs
       FROM worker_ratings WHERE worker_id = $1`,
      [workerId]
    );

    const skillsRes = await db.query(
      `SELECT skill_name, peer_review_count, video_url FROM worker_skills WHERE worker_id = $1`,
      [workerId]
    );

    const profileData = {
      ...workerRes.rows[0],
      stats: ratingsRes.rows[0],
      skills: skillsRes.rows[0] ? skillsRes.rows : [],
    };

    return res.json({ success: true, data: profileData, error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
});

function verifyMultipartOrJson(req, res, next) {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) {
    return upload.single('video')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, data: null, error: err.message || 'Upload failed' });
      }
      return next();
    });
  }
  return next();
}

router.post('/:id/verify', verifySupabaseJwt, verifyMultipartOrJson, async (req, res) => {
  const workerId = req.params.id;
  const { skill_name, video_base64 } = req.body;

  if (!(await assertWorkerOwnsParamId(req, res, workerId))) return;
  if (!skill_name) {
    return res.status(400).json({ success: false, data: null, error: 'skill_name is required' });
  }

  let buffer;
  if (req.file && req.file.buffer) {
    buffer = req.file.buffer;
  } else if (video_base64) {
    try {
      buffer = Buffer.from(String(video_base64), 'base64');
    } catch {
      return res.status(400).json({ success: false, data: null, error: 'Invalid video_base64' });
    }
  } else {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Provide multipart field "video" or JSON "video_base64"',
    });
  }

  const objectPath = `workers/${workerId}/${sanitizeSkillFileName(skill_name)}.mp4`;

  try {
    const { data: uploadData, error: upErr } = await getSupabaseAdmin().storage
      .from('verification-videos')
      .upload(objectPath, buffer, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (upErr) {
      return res.status(500).json({ success: false, data: null, error: upErr.message });
    }

    const storagePath = uploadData?.path || objectPath;

    const result = await db.query(
      `INSERT INTO worker_skills (worker_id, skill_name, video_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (worker_id, skill_name) DO UPDATE SET video_url = EXCLUDED.video_url
       RETURNING *`,
      [workerId, skill_name, storagePath]
    );

    return res.json({ success: true, data: result.rows[0], error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
});

router.patch('/:id/availability', verifySupabaseJwt, async (req, res) => {
  const workerId = req.params.id;
  const { availability_status } = req.body;

  try {
    if (!(await assertWorkerOwnsParamId(req, res, workerId))) return;

    const result = await db.query(
      `UPDATE workers SET availability_status = $1 WHERE id = $2 RETURNING id, availability_status`,
      [availability_status, workerId]
    );

    const statusStr = availability_status ? 'true' : 'false';
    await redisClient.setEx(`worker:availability:${workerId}`, 28800, statusStr);

    return res.json({ success: true, data: result.rows[0], error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
});

/** Customer submits a rating for a worker (requires customer JWT) */
router.post('/:id/ratings', verifyCustomer, async (req, res) => {
  const workerId = Number(req.params.id);
  const { job_id, rating, review_text } = req.body;
  const customerId = req.customer.id;

  if (!Number.isFinite(workerId) || rating == null) {
    return res.status(400).json({ success: false, data: null, error: 'worker id and rating are required' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO worker_ratings (worker_id, customer_id, job_id, rating, review_text)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [workerId, customerId, job_id || null, rating, review_text || null]
    );
    return res.status(201).json({ success: true, data: rows[0], error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
});

router.get('/:id/export-pdf', verifySupabaseJwt, async (req, res) => {
  if (!(await assertWorkerOwnsParamId(req, res, req.params.id))) return;
  return res.json({ success: true, data: { status: 'pdf_generated', download_url: 'dummy_url.pdf' }, error: null });
});

module.exports = router;
