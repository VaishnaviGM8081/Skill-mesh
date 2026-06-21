const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const authMiddleware = require('../middleware/authMiddleware');
const { supabase } = require('../config/supabase');

// Specific named routes MUST come before wildcard /:id routes
router.get('/me', authMiddleware, workerController.getMe);
router.get('/earnings', authMiddleware, workerController.getEarnings);
router.get('/jobs/history', authMiddleware, workerController.getJobHistory);

router.patch('/availability', authMiddleware, workerController.toggleAvailability);

router.post('/profile', authMiddleware, workerController.createOrUpdateProfile);

router.post('/skills', authMiddleware, workerController.addSkills);

router.get('/search', workerController.searchWorkers);

router.get('/:id/certificate', authMiddleware, workerController.getLatestCertificate);
router.get('/:id/certificate/latest', authMiddleware, workerController.getLatestCertificate);

// 🔥 ADD THIS ROUTE
router.put('/:id/pincode', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { pincode } = req.body;

        const { data, error } = await supabase
            .from('workers')
            .update({ pincode })
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) {
            return res.status(400).json({
                success: false,
                error: error.message,
            });
        }

        return res.json({
            success: true,
            data,
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});


router.get('/:id/profile', authMiddleware, workerController.getProfile);

module.exports = router;