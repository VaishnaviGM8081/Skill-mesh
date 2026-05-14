const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:id', authMiddleware, jobController.getJobById);
router.post('/', authMiddleware, jobController.createJobRequest);
router.get('/worker', authMiddleware, jobController.getWorkerPendingJobs);
router.patch('/:id/status', authMiddleware, jobController.updateJobStatus);

module.exports = router;
