const { supabase } = require('../config/supabase');

const jobController = {
  createJobRequest: async (req, res) => {
    try {
      const { worker_id, pincode, notes } = req.body;
      const supabase_uid = req.user.id;

      // Get customer_id from supabase_uid
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('supabase_uid', supabase_uid)
        .single();

      if (customerError) throw customerError;

      const { data, error } = await supabase
        .from('jobs')
        .insert({
          worker_id,
          customer_id: customer.id,
          status: 'pending',
          pincode,
          notes
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getWorkerPendingJobs: async (req, res) => {
    try {
      const supabase_uid = req.user.id;

      // Get worker_id from supabase_uid
      const { data: worker, error: workerError } = await supabase
        .from('workers')
        .select('id')
        .eq('supabase_uid', supabase_uid)
        .single();

      if (workerError) throw workerError;

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customers (
            name,
            phone,
            address
          )
        `)
        .eq('worker_id', worker.id)
        .eq('status', 'pending');

      if (error) throw error;
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  updateJobStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // in_progress, completed, cancelled

      const allowedStatuses = ['in_progress', 'completed', 'cancelled'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }

      const { data, error } = await supabase
        .from('jobs')
        .update({ status, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getJobById: async (req, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          workers (
            name,
            trade_category,
            average_rating
          ),
          customers (
            name,
            address
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = jobController;
