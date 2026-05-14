const { supabase } = require('../config/supabase');

const workerController = {
  createOrUpdateProfile: async (req, res) => {
    try {
      const { name, phone, trade_category, years_experience, pincode, payment_preference, availability_status } = req.body;
      const supabase_uid = req.user.id;

      const { data, error } = await supabase
        .from('workers')
        .upsert({
          supabase_uid,
          name,
          phone,
          trade_category,
          years_experience,
          pincode,
          payment_preference,
          availability_status,
          // Note: verification_level, trust_score, etc. have defaults in DB
        }, { onConflict: 'supabase_uid' })
        .select()
        .single();

      if (error) throw error;
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  addSkills: async (req, res) => {
    try {
      const { skill_name, photo_url } = req.body;
      const supabase_uid = req.user.id;

      // Get worker_id from supabase_uid
      const { data: worker, error: workerError } = await supabase
        .from('workers')
        .select('id')
        .eq('supabase_uid', supabase_uid)
        .single();

      if (workerError) throw workerError;

      const { data, error } = await supabase
        .from('worker_skills')
        .insert({
          worker_id: worker.id,
          skill_name,
          photo_url
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  searchWorkers: async (req, res) => {
    try {
      const { query } = req.query;

      const { data, error } = await supabase
        .from('workers')
        .select(`
          id,
          name,
          trade_category,
          years_experience,
          trust_score,
          average_rating,
          pincode,
          worker_skills (
            skill_name
          )
        `)
        .eq('availability_status', true)
        .or(`trade_category.ilike.%${query}%,worker_skills.skill_name.ilike.%${query}%`);

      if (error) throw error;
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getMe: async (req, res) => {
    try {
      const supabase_uid = req.user.id;
      const { data, error } = await supabase
        .from('workers')
        .select(`
          *,
          worker_skills (
            skill_name,
            photo_url
          )
        `)
        .eq('supabase_uid', supabase_uid)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows found"
      res.status(200).json({ success: true, data: data || null });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = workerController;
