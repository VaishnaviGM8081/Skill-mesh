const { supabase } = require('../config/supabase');

const workerController = {
  createOrUpdateProfile: async (req, res) => {
    try {
      const { name, phone, trade_category, years_experience, pincode, availability_status } = req.body;
      const supabase_uid = req.user.id;

      // Use limit(1) to safely handle any duplicate rows in dev
      const { data: rows } = await supabase
        .from('workers')
        .select('id')
        .eq('supabase_uid', supabase_uid)
        .limit(1);

      const existing = rows && rows.length > 0 ? rows[0] : null;

      let data, error;

      if (existing) {
        // Update existing worker by id (safer than eq on supabase_uid which may have duplicates)
        ({ data, error } = await supabase
          .from('workers')
          .update({ name, phone, trade_category, years_experience, pincode, availability_status })
          .eq('id', existing.id)
          .select());
        // Grab first result if multiple (handles stale dev duplicates)
        if (Array.isArray(data)) data = data[0];
      } else {
        // Insert new worker
        ({ data, error } = await supabase
          .from('workers')
          .insert({ supabase_uid, name, phone, trade_category, years_experience, pincode, availability_status })
          .select()
          .single());
      }

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
        .insert({ worker_id: worker.id, skill_name })
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
        .or(`trade_category.ilike.%${query}%`);

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
        .maybeSingle();

      if (error) throw error;
      res.status(200).json({ success: true, data: data || null });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = workerController;
