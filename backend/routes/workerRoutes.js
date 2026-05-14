const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/me', authMiddleware, workerController.getMe);
router.post('/profile', authMiddleware, workerController.createOrUpdateProfile);
router.post('/skills', authMiddleware, workerController.addSkills);
router.get('/search', workerController.searchWorkers); // Public search

module.exports = router;
