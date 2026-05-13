const express = require('express');
const { getSupabaseAuthClient } = require('../config/supabase');

const router = express.Router();

function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length >= 10) return `+${digits}`;
  return null;
}

router.post('/send-otp', async (req, res) => {
  let { phone } = req.body;
  phone = normalizePhone(phone);
  if (!phone) {
    return res.status(400).json({ success: false, data: null, error: 'Valid phone (E.164 or 10-digit IN) required' });
  }

  try {
    const supabase = getSupabaseAuthClient();
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) {
      return res.status(400).json({ success: false, data: null, error: error.message });
    }
    return res.json({ success: true, data: { sent: true }, error: null });
  } catch (e) {
    return res.status(500).json({ success: false, data: null, error: e.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  let { phone, token } = req.body;
  phone = normalizePhone(phone);
  if (!phone || !token) {
    return res.status(400).json({ success: false, data: null, error: 'phone and token are required' });
  }

  try {
    const supabase = getSupabaseAuthClient();
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: String(token).trim(),
      type: 'sms',
    });
    if (error || !data.session) {
      return res.status(400).json({ success: false, data: null, error: error?.message || 'OTP verification failed' });
    }

    return res.json({
      success: true,
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at,
        token_type: data.session.token_type,
        user: data.user,
      },
      error: null,
    });
  } catch (e) {
    return res.status(500).json({ success: false, data: null, error: e.message });
  }
});

module.exports = router;
