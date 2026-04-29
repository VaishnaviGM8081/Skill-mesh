const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
require('dotenv').config();

// Initialize SDK with sandbox keys injected from ENV
const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_fallback',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_fallback'
});

// 1. Create a secure payment order bound to a Job Request logic
router.post('/create-order', async (req, res) => {
  try {
    const { amount_inr } = req.body;
    const options = {
      amount: amount_inr * 100, // Converts to subunits (paise)
      currency: "INR",
      receipt: `rcpt_mock_${Math.floor(Math.random() * 10000)}`
    };

    const order = await rzp.orders.create(options);
    res.json({ success: true, order });
  } catch(error) {
    res.status(500).json({ success: false, error: "Razorpay Sandbox Generation Failed" });
  }
});

// 2. Validate cryptographic webhooks upon payment execution
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  
  // Calculate SHA256 HMAC for Razorpay verification
  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  if (digest === req.headers['x-razorpay-signature']) {
    console.log("Escrow Payment Securely Verified via Signature! Emitting Funding Status.");
    // In production: Execute db.query(`UPDATE jobs SET status = 'escrow_funded' ...`)
    res.status(200).json({ status: 'ok' });
  } else {
    res.status(403).json({ status: 'invalid_signature' });
  }
});

module.exports = router;
