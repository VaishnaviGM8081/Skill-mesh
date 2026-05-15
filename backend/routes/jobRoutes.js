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
    console.error('MATCH WORKERS API CRASH:', error);
    return res.status(500).json({ success: false, workers: [], error: error.message });
  }
});

router.post('/price-suggestion', async (req, res) => {
  try {
    const mlRes = await fetch('http://127.0.0.1:8000/api/price-suggestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await mlRes.json();
    res.json(data);
  } catch (error) {
    console.warn('ML Pricing failed, falling back to basic:', error.message);
    res.json({ suggested_min: 300, suggested_max: 800, currency: 'INR' });
  }
});

// Admin Stats Overview - CONNECTED TO SUPABASE
router.get('/overview', async (req, res) => {
  try {
    const { getSupabaseAdmin } = require('../config/supabase');
    const supabase = getSupabaseAdmin();

    // 1. Count Workers
    const { count: workerCount } = await supabase
      .from('workers')
      .select('*', { count: 'exact', head: true });

    // 2. Count Customers
    const { count: customerCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    // 3. Count Jobs created today
    const today = new Date();
    today.setHours(0,0,0,0);
    const { count: jobsToday } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // 4. Recent Jobs for the table
    const { data: recentJobs } = await supabase
      .from('jobs')
      .select('id, category, pincode, status')
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      success: true,
      data: {
        activeWorkers: workerCount || 0,
        jobsToday: jobsToday || 0,
        openDisputes: 0, // Placeholder until disputes table is ready
        activeUsers: (workerCount || 0) + (customerCount || 0),
        recentJobs: recentJobs || []
      }
    });
  } catch (error) {
    console.error('Admin Overview Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin User Directory
router.get('/users', async (req, res) => {
  try {
    const { getSupabaseAdmin } = require('../config/supabase');
    const supabase = getSupabaseAdmin();

    const { data: workers } = await supabase
      .from('workers')
      .select('id, name, trade_category, average_rating, phone');

    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, phone');

    res.json({
      success: true,
      data: {
        workers: workers || [],
        customers: customers || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin Verification Queue
router.get('/verify/queue', async (req, res) => {
  try {
    const { getSupabaseAdmin } = require('../config/supabase');
    const supabase = getSupabaseAdmin();

    const { data: pending } = await supabase
      .from('workers')
      .select('id, name, trade_category, id_card_url, certificate_url')
      .eq('is_verified', false)
      .not('id_card_url', 'is', null);

    res.json({
      success: true,
      data: pending || []
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin Approve Worker
router.post('/verify/approve', async (req, res) => {
  try {
    const { worker_id } = req.body;
    const { getSupabaseAdmin } = require('../config/supabase');
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('workers')
      .update({ is_verified: true, verification_level: 'silver' })
      .eq('id', worker_id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Wildcard routes last
router.post('/', authMiddleware, jobController.createJobRequest);
router.post('/:id/rate', authMiddleware, jobController.rateJob);
router.patch('/:id/status', authMiddleware, jobController.updateJobStatus);
router.get('/:id', authMiddleware, jobController.getJobById);

module.exports = router;
