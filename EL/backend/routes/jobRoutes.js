const express = require('express');
const router = express.Router();
const db = require('../db');
const redisClient = require('../redisClient');

// Geo-matching core logic (called within request)
async function findBestMatch(jobRequest) {
  // Query PostGIS for workers within 5km, available, matching trade, not locked out in Redis
  const { customer_id, trade_category, latitude, longitude } = jobRequest;

  // 5000 meters = 5km
  const matchedWorkersQuery = `
    SELECT id, name, phone, trade_category, verification_level,
           ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as dist_meters
    FROM workers
    WHERE trade_category = $3
      AND availability_status = true
      AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 5000)
    ORDER BY dist_meters ASC
    LIMIT 3;
  `;

  const { rows } = await db.query(matchedWorkersQuery, [longitude, latitude, trade_category]);
  return rows; // Returns top 3 nearby
}

// Request a job
router.post('/request', async (req, res) => {
  const { customer_id, trade_category, latitude, longitude } = req.body;
  try {
    const jobRes = await db.query(
      `INSERT INTO jobs (customer_id, trade_category, status)
       VALUES ($1, $2, 'requested') RETURNING id`,
      [customer_id, trade_category]
    );

    const jobId = jobRes.rows[0].id;
    const candidates = await findBestMatch(req.body);

    if (candidates.length === 0) {
      return res.status(404).json({ success: false, data: null, error: 'No workers nearby' });
    }

    // Assign to best match (candidate 0) for now
    const topCandidate = candidates[0];
    await db.query(
      `UPDATE jobs SET worker_id = $1, status = 'matched' WHERE id = $2`,
      [topCandidate.id, jobId]
    );

    // Lock worker in Redis for 4 hours (14400s)
    await redisClient.setEx(`worker:job_lock:${topCandidate.id}`, 14400, jobId.toString());

    res.status(200).json({ success: true, data: { job_id: jobId, worker: topCandidate }, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
});

// Dispute Flow Placeholder
router.post('/:id/dispute', async (req, res) => {
  const jobId = req.params.id;
  try {
    await db.query(`UPDATE jobs SET status = 'disputed' WHERE id = $1`, [jobId]);
    res.json({ success: true, data: { status: 'disputed' }, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
});

// Admin Resolve Dispute Placeholder
router.patch('/:id/dispute/resolve', async (req, res) => {
  const jobId = req.params.id;
  const { decision } = req.body; // 'release_to_worker' | 'refund_customer' | 'split'
  try {
    await db.query(`UPDATE jobs SET status = 'completed' WHERE id = $1`, [jobId]);
    res.json({ success: true, data: { status: 'resolved', decision }, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
});

// Accept a job
router.post('/:id/accept', async (req, res) => {
  const jobId = req.params.id;
  try {
    // In production, also verify worker_id matches their JWT
    await db.query(`UPDATE jobs SET status = 'accepted' WHERE id = $1`, [jobId]);
    res.json({ success: true, data: { status: 'accepted' }, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
});

// Complete a job
router.post('/:id/complete', async (req, res) => {
  const jobId = req.params.id;
  try {
    await db.query(`UPDATE jobs SET status = 'completed' WHERE id = $1`, [jobId]);
    res.json({ success: true, data: { status: 'completed' }, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
});

module.exports = router;
