const { getSupabaseAdmin } = require('../config/supabase');
const supabase = getSupabaseAdmin();

const jobController = {
  createJobRequest: async (req, res) => {
    try {
      const { worker_id, pincode, notes, amount, trade_category } = req.body;
      const supabase_uid = req.user.id;

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('supabase_uid', supabase_uid)
        .limit(1)
        .maybeSingle();

      if (customerError) throw customerError;

      let customerId;
      if (!customer) {
        // Auto-create customer on first booking
        const { data: newCustomer, error: createErr } = await supabase
          .from('customers')
          .insert({ supabase_uid, name: 'Customer', phone: 'unknown' })
          .select('id')
          .single();
        if (createErr) throw createErr;
        customerId = newCustomer.id;
      } else {
        customerId = customer.id;
      }

      // Map to actual DB column names
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          worker_id,
          customer_id: customerId,
          status: 'pending',
          pincode,
          notes,
          description: notes || null,
          budget: amount || null,
          category: trade_category || null,
        })
        .select(`
          *,
          workers ( name, trade_category, average_rating, phone ),
          customers ( name, phone )
        `)
        .single();

      if (error) throw error;
      res.status(201).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // POST /api/jobs/:id/rate  — customer rates worker after completion
  rateJob: async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, review } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
      }

      // Get job to find worker_id
      const { data: job, error: jobErr } = await supabase
        .from('jobs')
        .select('id, worker_id, status, additional_requirements')
        .eq('id', id)
        .maybeSingle();

      if (jobErr) throw jobErr;
      if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
      if (job.status !== 'completed') return res.status(400).json({ success: false, error: 'Can only rate completed jobs' });
      
      let reqs = {};
      try {
        reqs = JSON.parse(job.additional_requirements || '{}');
      } catch (e) {}

      if (reqs.customer_rating) {
        return res.status(400).json({ success: false, error: 'Job already rated' });
      }

      reqs.customer_rating = rating;
      reqs.customer_review = review || null;

      // Store rating in additional_requirements field (no dedicated rating column yet)
      await supabase.from('jobs').update({
        additional_requirements: JSON.stringify(reqs)
      }).eq('id', id);

      // Recalculate worker average rating
      const { data: worker } = await supabase
        .from('workers')
        .select('average_rating, total_ratings')
        .eq('id', job.worker_id)
        .maybeSingle();

      if (worker) {
        const oldTotal = Number(worker.total_ratings) || 0;
        const oldAvg = Number(worker.average_rating) || 0;
        const newTotal = oldTotal + 1;
        const newAvg = ((oldAvg * oldTotal) + Number(rating)) / newTotal;

        await supabase.from('workers').update({
          average_rating: Math.round(newAvg * 10) / 10,
          total_ratings: newTotal,
        }).eq('id', job.worker_id);
      }

      res.status(200).json({ success: true, message: 'Rating submitted. Thank you!' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /api/jobs/customer/history — customer's own job history
  getCustomerJobs: async (req, res) => {
    try {
      const supabase_uid = req.user.id;

      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('supabase_uid', supabase_uid)
        .limit(1)
        .maybeSingle();

      if (!customer) return res.status(200).json({ success: true, data: [] });

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id, status, notes, description, pincode, budget, category,
          additional_requirements, created_at,
          workers ( name, trade_category, average_rating )
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      // Normalize fields for frontend
      const normalized = (data || []).map(j => ({
        ...j,
        amount: j.budget,
        trade_category: j.category,
        customer_rating: (() => {
          try { return JSON.parse(j.additional_requirements || '{}').customer_rating || null; }
          catch { return null; }
        })(),
      }));
      res.status(200).json({ success: true, data: normalized });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getWorkerPendingJobs: async (req, res) => {
    try {
      const supabase_uid = req.user.id;

      const { data: worker, error: workerError } = await supabase
        .from('workers')
        .select('id')
        .eq('supabase_uid', supabase_uid)
        .limit(1)
        .maybeSingle();

      if (workerError) throw workerError;
      if (!worker) return res.status(200).json({ success: true, data: [] });

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customers (
            name,
            phone
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

      const allowedStatuses = ['in_progress', 'completed', 'cancelled', 'rejected'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }

      const { data, error } = await supabase
        .from('jobs')
        .update({ status })
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
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  analyzeJobDescription: async (req, res) => {
    try {
      const { description } = req.body;
      if (!description) {
        return res.status(400).json({ success: false, error: 'Description is required' });
      }

      // Try to call Python ML service
      try {
        const mlRes = await fetch('http://localhost:8000/api/ml/parse-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description })
        });
        
        if (mlRes.ok) {
           const data = await mlRes.json();
           return res.json({ success: true, data: data.data || data });
        }
      } catch (err) {
        console.warn('ML Service unreachable, falling back to mock logic:', err.message);
      }

      // Fallback mock logic if ML service is down
      const lowerDesc = description.toLowerCase();
      let skill = 'Plumber'; // default
      if (lowerDesc.includes('pipe') || lowerDesc.includes('leak') || lowerDesc.includes('plumb')) skill = 'Plumber';
      else if (lowerDesc.includes('wire') || lowerDesc.includes('switch') || lowerDesc.includes('light')) skill = 'Electrician';
      else if (lowerDesc.includes('wood') || lowerDesc.includes('door') || lowerDesc.includes('furniture')) skill = 'Carpenter';
      else if (lowerDesc.includes('paint') || lowerDesc.includes('wall')) skill = 'Painter';

      res.status(200).json({
        success: true,
        data: {
          skill,
          intent: 'Repair/Maintenance',
          urgency: lowerDesc.includes('urgent') || lowerDesc.includes('emergency') ? 'High' : 'Medium'
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = jobController;
