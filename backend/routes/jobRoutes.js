const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/authMiddleware');
const { matchWorkers } = require('../utils/matchWorkers');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const upload = multer({ storage: multer.memoryStorage() });

// Specific routes MUST come before wildcard /:id routes
router.post('/analyze', jobController.analyzeJobDescription);
router.get('/worker', authMiddleware, jobController.getWorkerPendingJobs);
router.get('/customer/history', authMiddleware, jobController.getCustomerJobs);

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No audio file provided' });
  try {
    const formData = new FormData();
    formData.append('file', req.file.buffer, { 
      filename: 'audio.m4a', 
      contentType: req.file.mimetype || 'audio/m4a' 
    });
    
    const mlRes = await fetch('http://127.0.0.1:8000/api/transcribe', {
      method: 'POST',
      body: formData,
    });
    
    const data = await mlRes.json();
    console.log('ML Service response:', data);
    
    if (!mlRes.ok) {
      console.error('ML Service Error:', data);
      throw new Error(data.detail || 'Transcription failed on ML server');
    }
    
    const finalResponse = { success: true, text: data.text || '' };
    console.log('Sending response to frontend:', finalResponse);
    res.json(finalResponse);
  } catch (error) {
    console.error('Transcription proxy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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
