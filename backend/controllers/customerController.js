const { supabase } = require('../config/supabase');

const customerController = {
  createOrUpdateProfile: async (req, res) => {
    try {
      // Schema: customers has id, supabase_uid, name, phone, created_at only
      const { name, phone } = req.body;
      const supabase_uid = req.user.id;

      let { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('supabase_uid', supabase_uid)
        .maybeSingle();

      let query;
      if (existing) {
        query = supabase
          .from('customers')
          .update({ name, phone })
          .eq('supabase_uid', supabase_uid);
      } else {
        query = supabase
          .from('customers')
          .insert({ supabase_uid, name, phone });
      }

      const { data, error } = await query.select().single();

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
        .from('customers')
        .select('*')
        .eq('supabase_uid', supabase_uid)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      res.status(200).json({ success: true, data: data || null });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = customerController;
