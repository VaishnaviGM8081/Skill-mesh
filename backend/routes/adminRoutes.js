const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/overview', async (req, res) => {
  try {
    const activeWorkersRes = await db.query(`SELECT COUNT(*) FROM workers WHERE availability_status = true`);
    const jobsRes = await db.query(`SELECT COUNT(*) FROM jobs`); // Mocks 'today' for demo logic
    const disputeRes = await db.query(`SELECT COUNT(*) FROM jobs WHERE status = 'disputed'`);
    // Random mock volume metric based on jobs
    const escrowVolume = parseInt(jobsRes.rows[0].count) * 450; 

    res.json({
      success: true,
      data: {
        activeWorkers: activeWorkersRes.rows[0].count,
        jobsToday: jobsRes.rows[0].count,
        openDisputes: disputeRes.rows[0].count,
        escrowVolume: `₹${(escrowVolume / 1000).toFixed(1)}K`
      },
      error: null
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
});

module.exports = router;
