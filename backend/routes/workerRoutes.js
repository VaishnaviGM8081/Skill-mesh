const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const authMiddleware = require('../middleware/authMiddleware');

// Specific named routes MUST come before wildcard /:id routes
router.get('/me', authMiddleware, workerController.getMe);
router.get('/earnings', authMiddleware, workerController.getEarnings);
router.get('/jobs/history', authMiddleware, workerController.getJobHistory);
router.patch('/availability', authMiddleware, workerController.toggleAvailability);
router.post('/profile', authMiddleware, workerController.createOrUpdateProfile);
router.post('/skills', authMiddleware, workerController.addSkills);
router.get('/search', workerController.searchWorkers);
router.get('/:id/profile', authMiddleware, workerController.getProfile);

module.exports = router;
