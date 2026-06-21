const express = require('express');
const router = express.Router();
const blockchainController = require('../controllers/blockchainController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/record-job', authMiddleware, blockchainController.recordJob);
router.post('/update-trust-score', authMiddleware, blockchainController.updateTrustScore);
router.get('/passport/:workerId', authMiddleware, blockchainController.getPassport);
router.get('/verify/:jobId', authMiddleware, blockchainController.verifyJob);

module.exports = router;
