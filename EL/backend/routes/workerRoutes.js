const express = require('express');
const router = express.Router();
const db = require('../db');
const redisClient = require('../redisClient');

// Register a new worker
router.post('/register', async (req, res) => {
  const { name, phone, trade_category, latitude, longitude } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO workers (name, phone, trade_category, location) 
       VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)) 
       RETURNING id, name, trade_category, verification_level`,
      [name, phone, trade_category, longitude, latitude]
    );
    res.status(201).json({ success: true, data: result.rows[0], error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
});

// Profile endpoint
router.get('/:id/profile', async (req, res) => {
  const workerId = req.params.id;
  try {
    const workerRes = await db.query(
      `SELECT id, name, phone, trade_category, verification_level, availability_status, created_at,
              ST_AsGeoJSON(location) as location 
       FROM workers WHERE id = $1`,
      [workerId]
    );
    
    if (workerRes.rows.length === 0) {
      return res.status(404).json({ success: false, data: null, error: 'Worker not found' });
    }

    const ratingsRes = await db.query(
      `SELECT AVG(rating)::numeric(10,1) as avg_rating, COUNT(*) as total_jobs
       FROM worker_ratings WHERE worker_id = $1`,
      [workerId]
    );

    const skillsRes = await db.query(
      `SELECT skill_name, peer_review_count FROM worker_skills WHERE worker_id = $1`,
      [workerId]
    );

    const profileData = {
      ...workerRes.rows[0],
      stats: ratingsRes.rows[0],
      skills: skillsRes.rows[0] ? skillsRes.rows : []
    };

    res.json({ success: true, data: profileData, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
});

// Submit verification video
router.post('/:id/verify', async (req, res) => {
  const workerId = req.params.id;
  const { skill_name, video_url } = req.body;
  
  try {
    const result = await db.query(
      `INSERT INTO worker_skills (worker_id, skill_name, video_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (worker_id, skill_name) DO UPDATE SET video_url = EXCLUDED.video_url
       RETURNING *`,
      [workerId, skill_name, video_url]
    );
    res.json({ success: true, data: result.rows[0], error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
});

// Toggle availability
router.patch('/:id/availability', async (req, res) => {
  const workerId = req.params.id;
  const { availability_status } = req.body;
  
  try {
    // DB Update
    const result = await db.query(
      `UPDATE workers SET availability_status = $1 WHERE id = $2 RETURNING id, availability_status`,
      [availability_status, workerId]
    );
    
    // Redis Update
    const statusStr = availability_status ? 'true' : 'false';
    // TTL of 8 hours (28800 seconds)
    await redisClient.setEx(`worker:availability:${workerId}`, 28800, statusStr);

    res.json({ success: true, data: result.rows[0], error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
});

// Generate Export PDF dummy route for now
router.get('/:id/export-pdf', (req, res) => {
  res.json({ success: true, data: { status: 'pdf_generated', download_url: 'dummy_url.pdf' }, error: null });
});

module.exports = router;
