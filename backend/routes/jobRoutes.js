const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/authMiddleware');
const { matchWorkers } = require('../utils/matchWorkers');

// Specific routes MUST come before wildcard /:id routes
router.post('/analyze', jobController.analyzeJobDescription);
router.get('/worker', authMiddleware, jobController.getWorkerPendingJobs);
router.get('/customer/history', authMiddleware, jobController.getCustomerJobs);

// Geo-aware worker matching
router.get('/match-workers', async (req, res) => {
  const { latitude, longitude, skill, pincode } = req.query;
  if (!skill) return res.status(400).json({ success: false, workers: [], error: 'skill is required' });
  const lat = latitude ? parseFloat(latitude) : null;
  const lng = longitude ? parseFloat(longitude) : null;
  try {
    const workers = await matchWorkers(lat, lng, skill, pincode);
    return res.json({ success: true, workers });
  } catch (error) {
    return res.status(500).json({ success: false, workers: [], error: error.message });
  }
});

// Wildcard routes last
router.post('/', authMiddleware, jobController.createJobRequest);
router.post('/:id/rate', authMiddleware, jobController.rateJob);
router.patch('/:id/status', authMiddleware, jobController.updateJobStatus);
router.get('/:id', authMiddleware, jobController.getJobById);

module.exports = router;
