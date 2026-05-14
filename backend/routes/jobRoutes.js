const express = require('express');
const router = express.Router();
const db = require('../config/db');
const redisClient = require('../config/redisClient');
const { verifyCustomer } = require('../middleware/customerContext');
const { verifyWorker } = require('../middleware/workerContext');

async function findBestMatch(jobRequest) {
  const { trade_category, latitude, longitude } = jobRequest;

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
  return rows;
}

router.post('/request', verifyCustomer, async (req, res) => {
  const customer_id = req.customer.id;
  const { trade_category, latitude, longitude } = req.body;

  if (!trade_category || latitude == null || longitude == null) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'trade_category, latitude, longitude are required',
    });
  }

  try {
    const jobRes = await db.query(
      `INSERT INTO jobs (customer_id, trade_category, status)
       VALUES ($1, $2, 'requested') RETURNING id`,
      [customer_id, trade_category]
    );

    const jobId = jobRes.rows[0].id;
    const candidates = await findBestMatch({ ...req.body, customer_id });

    if (candidates.length === 0) {
      return res.status(404).json({ success: false, data: null, error: 'No workers nearby' });
    }

    const topCandidate = candidates[0];
    await db.query(`UPDATE jobs SET worker_id = $1, status = 'matched' WHERE id = $2`, [
      topCandidate.id,
      jobId,
    ]);

    await redisClient.setEx(`worker:job_lock:${topCandidate.id}`, 14400, jobId.toString());

    return res.status(200).json({ success: true, data: { job_id: jobId, worker: topCandidate }, error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
});

router.post('/:id/dispute', verifyCustomer, async (req, res) => {
  const jobId = req.params.id;
  try {
    const jobCheck = await db.query(`SELECT customer_id FROM jobs WHERE id = $1`, [jobId]);
    if (!jobCheck.rows.length) {
      return res.status(404).json({ success: false, data: null, error: 'Job not found' });
    }
    if (jobCheck.rows[0].customer_id !== req.customer.id) {
      return res.status(403).json({ success: false, data: null, error: 'Forbidden' });
    }
    await db.query(`UPDATE jobs SET status = 'disputed' WHERE id = $1`, [jobId]);
    return res.json({ success: true, data: { status: 'disputed' }, error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
});

router.patch('/:id/dispute/resolve', async (req, res) => {
  const jobId = req.params.id;
  const { decision } = req.body;
  try {
    await db.query(`UPDATE jobs SET status = 'completed' WHERE id = $1`, [jobId]);
    return res.json({ success: true, data: { status: 'resolved', decision }, error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
});

router.post('/:id/accept', verifyWorker, async (req, res) => {
  const jobId = req.params.id;
  try {
    const { rows } = await db.query(`SELECT worker_id, status FROM jobs WHERE id = $1`, [jobId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, data: null, error: 'Job not found' });
    }
    if (rows[0].worker_id !== req.worker.id) {
      return res.status(403).json({ success: false, data: null, error: 'Job not assigned to this worker' });
    }
    await db.query(`UPDATE jobs SET status = 'in_progress' WHERE id = $1`, [jobId]);
    return res.json({ success: true, data: { status: 'in_progress' }, error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
});

router.post('/:id/complete', verifyWorker, async (req, res) => {
  const jobId = req.params.id;
  try {
    const { rows } = await db.query(`SELECT worker_id FROM jobs WHERE id = $1`, [jobId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, data: null, error: 'Job not found' });
    }
    if (rows[0].worker_id !== req.worker.id) {
      return res.status(403).json({ success: false, data: null, error: 'Forbidden' });
    }
    await db.query(`UPDATE jobs SET status = 'completed' WHERE id = $1`, [jobId]);
    return res.json({ success: true, data: { status: 'completed' }, error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
});

// Analyze job description
router.post('/analyze', async (req, res) => {
  const { description } = req.body;
  try {
    const response = await fetch('http://localhost:8000/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description })
    });
    const data = await response.json();
    res.json({ success: true, data, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
});

module.exports = router;
