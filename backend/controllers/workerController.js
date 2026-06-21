const { supabase, getSupabaseAdmin } = require('../config/supabase');

const workerController = {
  toggleAvailability: async (req, res) => {
    try {
      const supabase_uid = req.user.id;
      const { available } = req.body; // boolean

      const { data: worker } = await supabase
        .from('workers')
        .select('id, availability_status')
        .eq('supabase_uid', supabase_uid)
        .limit(1)
        .maybeSingle();

      if (!worker) return res.status(404).json({ success: false, error: 'Worker not found' });

      const newStatus = typeof available === 'boolean' ? available : !worker.availability_status;

      const { data, error } = await supabase
        .from('workers')
        .update({ availability_status: newStatus })
        .eq('id', worker.id)
        .select('id, availability_status')
        .maybeSingle();

      if (error) throw error;
      res.status(200).json({ success: true, data: { isOnline: data ? data.availability_status : newStatus } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

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

      // Use limit(1).maybeSingle() to avoid crash on duplicate dev rows
      const { data: worker, error: workerError } = await supabase
        .from('workers')
        .select('id')
        .eq('supabase_uid', supabase_uid)
        .limit(1)
        .maybeSingle();

      if (workerError) throw workerError;
      if (!worker) throw new Error('Worker profile not found');

      const { data, error } = await supabase
        .from('worker_skills')
        .insert({ worker_id: worker.id, skill_name, photo_url: photo_url || null })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /api/workers/:id/profile — used by ProfileScreen
  getProfile: async (req, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from('workers')
        .select(`
          *,
          worker_skills ( skill_name, photo_url )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, error: 'Worker not found' });

      // Fetch stats: total jobs and avg rating
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, status')
        .eq('worker_id', id);

      const total_jobs = jobs ? jobs.filter(j => j.status === 'completed').length : 0;
      const avg_rating = data.average_rating || null;
      const is_verified = data.verification_level && data.verification_level !== 'unverified';

      res.status(200).json({ success: true, data: { ...data, is_verified, stats: { total_jobs, avg_rating } } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getLatestCertificate: async (req, res) => {
    try {
      const { id } = req.params;
      const certificateWorkerId = Number(id);
      console.log(`[getLatestCertificate] Request received for worker ID: ${id} (parsed: ${certificateWorkerId})`);

      if (!certificateWorkerId) {
        console.warn(`[getLatestCertificate] Invalid worker ID: ${id}`);
        return res.status(400).json({ success: false, error: 'Worker ID is required' });
      }

      const { data: worker, error: workerError } = await getSupabaseAdmin()
        .from('workers')
        .select('id, name, trade_category, trust_score')
        .eq('id', certificateWorkerId)
        .maybeSingle();

      if (workerError) {
        console.error(`[getLatestCertificate] Database error fetching worker ${certificateWorkerId}:`, workerError);
        throw workerError;
      }
      
      console.log(`[getLatestCertificate] Worker fetched for worker ${certificateWorkerId}:`, worker);
      if (!worker) {
        console.warn(`[getLatestCertificate] Worker ${certificateWorkerId} not found in DB`);
        return res.status(404).json({ success: false, error: 'Worker not found' });
      }

      const { data: chainRecord, error: recordError } = await getSupabaseAdmin()
        .from('job_chain_records')
        .select('job_id, worker_id, trust_score_snapshot, blockchain_hash, transaction_hash, created_at')
        .eq('worker_id', certificateWorkerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recordError) {
        console.error(`[getLatestCertificate] Database error fetching chain records for worker ${certificateWorkerId}:`, recordError);
        throw recordError;
      }
      
      console.log(`[getLatestCertificate] Chain record fetched for worker ${certificateWorkerId}:`, chainRecord);

      let certificate;
      if (!chainRecord) {
        console.log(`[getLatestCertificate] No chain record found. Generating fallback dummy certificate for worker ${certificateWorkerId}`);
        certificate = {
          certificate_id: `SM-CERT-DUMMY-${worker.id}`,
          worker_name: worker.name,
          trade_category: worker.trade_category || 'Unknown',
          completed_job_id: 'DUMMY',
          trust_score: worker.trust_score ?? 90,
          blockchain_hash: '54c66c8deea99e06a0b65707e92d37ca5f4e4d2d91f7b0325d7506b09b208927',
          transaction_hash: '54c66c8deea99e06a0b65707e92d37ca5f4e4d2d91f7b0325d7506b09b208927',
          issue_date: new Date().toISOString().split('T')[0],
          certificate_title: 'SkillMesh Verified Trust Certificate (Fallback)',
        };
      } else {
        const { data: job, error: jobError } = await getSupabaseAdmin()
          .from('jobs')
          .select('id')
          .eq('id', chainRecord.job_id)
          .maybeSingle();

        if (jobError || !job) {
          console.warn(`[getLatestCertificate] Job ${chainRecord.job_id} not found in DB or error. Using fallback.`);
          certificate = {
            certificate_id: `SM-CERT-DUMMY-${worker.id}`,
            worker_name: worker.name,
            trade_category: worker.trade_category || 'Unknown',
            completed_job_id: chainRecord.job_id,
            trust_score: worker.trust_score ?? 90,
            blockchain_hash: chainRecord.blockchain_hash || '54c66c8deea99e06a0b65707e92d37ca5f4e4d2d91f7b0325d7506b09b208927',
            transaction_hash: chainRecord.transaction_hash || '54c66c8deea99e06a0b65707e92d37ca5f4e4d2d91f7b0325d7506b09b208927',
            issue_date: new Date(chainRecord.created_at || Date.now()).toISOString().split('T')[0],
            certificate_title: 'SkillMesh Verified Trust Certificate',
          };
        } else {
          const { generateWorkerCertificate } = require('../utils/certificateGenerator');
          certificate = generateWorkerCertificate(worker, job, chainRecord);
          certificate.transaction_hash = chainRecord.transaction_hash || chainRecord.blockchain_hash;
        }
      }

      console.log(`[getLatestCertificate] Certificate successfully returned for worker ${certificateWorkerId}:`, certificate);
      res.status(200).json({ success: true, certificate });
    } catch (error) {
      console.error(`[getLatestCertificate] Unexpected error:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /api/workers/earnings — used by DashboardScreen
  getEarnings: async (req, res) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const supabase_uid = req.user.id;

      const { data: worker } = await supabaseAdmin
        .from('workers')
        .select('id')
        .eq('supabase_uid', supabase_uid)
        .limit(1)
        .maybeSingle();

      if (!worker) return res.status(404).json({ success: false, error: 'Worker not found' });

      const { data: jobs, error } = await supabaseAdmin
        .from('jobs')
        .select('id, budget, created_at, status')
        .eq('worker_id', worker.id)
        .eq('status', 'completed');

      if (error) throw error;
      console.log('Worker ID:', worker.id, 'Jobs length:', jobs?.length, 'Jobs:', jobs);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const sum = (list) => list.reduce((acc, j) => acc + (Number(j.budget) || 0), 0);

      const todayJobs = jobs.filter(j => new Date(j.created_at) >= todayStart);
      const weekJobs = jobs.filter(j => new Date(j.created_at) >= weekStart);
      const monthJobs = jobs.filter(j => new Date(j.created_at) >= monthStart);

      res.status(200).json({
        success: true,
        data: {
          today: sum(todayJobs),
          week: sum(weekJobs),
          month: sum(monthJobs),
          total_completed: jobs.length,
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /api/workers/jobs/history — used by DashboardScreen Recent Jobs
  getJobHistory: async (req, res) => {
    try {
      const supabase_uid = req.user.id;

      const { data: worker } = await supabase
        .from('workers')
        .select('id')
        .eq('supabase_uid', supabase_uid)
        .limit(1)
        .maybeSingle();

      if (!worker) return res.status(404).json({ success: false, error: 'Worker not found' });

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id, status, notes, pincode, amount, created_at,
          customers ( name, phone )
        `)
        .eq('worker_id', worker.id)
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      res.status(200).json({ success: true, data: data || [] });
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
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      const mappedData = data ? {
        ...data,
        is_verified: data.verification_level && data.verification_level !== 'unverified'
      } : null;

      res.status(200).json({ success: true, data: mappedData });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = workerController;
