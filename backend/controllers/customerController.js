const { supabase } = require('../config/supabase');

const customerController = {
  createOrUpdateProfile: async (req, res) => {
    try {
      const { name, phone, address, pincode } = req.body;
      const supabase_uid = req.user.id;

      const { data, error } = await supabase
        .from('customers')
        .upsert({
          supabase_uid,
          name,
          phone,
          address,
          pincode,
          updated_at: new Date()
        }, { onConflict: 'supabase_uid' })
        .select()
        .single();

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
