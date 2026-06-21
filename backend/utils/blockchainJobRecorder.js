const { getSupabaseAdmin } = require('../config/supabase');
const crypto = require('crypto');
const {
  calculateTrustScore,
} = require('./trustScore');

function generateSHA256RecordHash({ jobId, workerId, workerName, trustScore, timestamp }) {
  const payload = `${jobId}-${workerId}-${workerName}-${trustScore}-${timestamp}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

async function recordCompletedJobOnChain(jobId, overrides = {}) {
  try {
    const supabase = getSupabaseAdmin();

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, worker_id, status, created_at')
      .eq('id', jobId)
      .maybeSingle();

    if (jobError) throw jobError;
    if (!job) throw new Error('Job not found');
    if (job.status !== 'completed') throw new Error('Job must be completed before recording on blockchain');

    const { data: existingRecord, error: existingError } = await supabase
      .from('job_chain_records')
      .select('id')
      .eq('job_id', jobId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingRecord) {
      return { alreadyRecorded: true };
    }

    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id, name, trust_score')
      .eq('id', job.worker_id)
      .maybeSingle();

    if (workerError) throw workerError;
    if (!worker) throw new Error('Worker not found');

    const { data: completedJobs, error: completedJobsError } = await supabase
      .from('jobs')
      .select('id')
      .eq('worker_id', worker.id)
      .eq('status', 'completed');

    if (completedJobsError) throw completedJobsError;

    const completedJobsCount = Array.isArray(completedJobs) ? completedJobs.length : 0;
    const trustScoreSnapshot = Number(worker.trust_score) || 0;
    const recordTimestamp = new Date().toISOString();

    const blockchainHash = generateSHA256RecordHash({
      jobId: job.id,
      workerId: worker.id,
      workerName: worker.name,
      trustScore: trustScoreSnapshot,
      timestamp: recordTimestamp,
    });

    console.log(`Recording blockchain job ${job.id} for worker ${worker.id} with trust score ${trustScoreSnapshot}`);

    const { data: record, error: insertError } = await supabase
      .from('job_chain_records')
      .insert({
        job_id: job.id,
        worker_id: worker.id,
        trust_score_snapshot: trustScoreSnapshot,
        blockchain_hash: blockchainHash,
        transaction_hash: blockchainHash,
        created_at: recordTimestamp,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Blockchain record insert failed', insertError);
      throw insertError;
    }

    console.log(`Blockchain record inserted with id ${record.id} for job ${job.id}`);

    const passport = await updateWorkerTrustScore(job.worker_id);

    return {
      success: true,
      record,
      passport,
    };
  } catch (err) {
    console.error('recordCompletedJobOnChain failed:', err);
    throw err;
  }
}

async function updateWorkerTrustScore(workerId) {
  const supabase = getSupabaseAdmin();

  const { data: worker, error: workerError } = await supabase
    .from('workers')
    .select('id, average_rating, response_rate, verification_level')
    .eq('id', workerId)
    .maybeSingle();

  if (workerError) throw workerError;
  if (!worker) throw new Error('Worker not found');

  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, status')
    .eq('worker_id', workerId);

  if (jobsError) throw jobsError;

  const totalAssigned = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === 'completed').length;
  const disputeCount = jobs.filter((j) => j.status === 'disputed').length;
  const completionRate = totalAssigned > 0 ? completedJobs / totalAssigned : 1;
  const averageRating = Number(worker.average_rating) || 0;
  const responseReliability = Number(worker.response_rate) || 1;

  const trustScore = calculateTrustScore({
    averageRating,
    completionRate,
    responseReliability,
    disputeCount,
    totalJobs: totalAssigned,
  });

  const blockchainRecords = await supabase
    .from('job_chain_records')
    .select('id')
    .eq('worker_id', workerId);

  const blockchainVerified = Array.isArray(blockchainRecords.data) && blockchainRecords.data.length > 0;

  const { data: updatedWorker, error: updateError } = await supabase
    .from('workers')
    .update({
      trust_score: trustScore,
      completed_jobs: completedJobs,
      blockchain_verified: blockchainVerified,
    })
    .eq('id', workerId)
    .select()
    .single();

  if (updateError) throw updateError;

  return {
    worker_id: workerId,
    trust_score: trustScore,
    total_jobs: completedJobs,
    dispute_count: disputeCount,
    blockchain_verified: blockchainVerified,
    average_rating: averageRating,
    verification_status: worker.verification_level || 'unverified',
    response_reliability: responseReliability,
  };
}

async function getWorkerPassport(workerId) {
  const supabase = getSupabaseAdmin();

  const { data: worker, error: workerError } = await supabase
    .from('workers')
    .select('id, name, trust_score, blockchain_verified, verification_level, average_rating, response_rate')
    .eq('id', workerId)
    .maybeSingle();

  if (workerError) throw workerError;
  if (!worker) throw new Error('Worker not found');

  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, status')
    .eq('worker_id', workerId);

  if (jobsError) throw jobsError;

  const totalCompleted = jobs.filter((j) => j.status === 'completed').length;
  const disputeCount = jobs.filter((j) => j.status === 'disputed').length;
  const totalAssigned = jobs.length;
  const completionRate = totalAssigned > 0 ? totalCompleted / totalAssigned : 1;

  const trustScore = worker.trust_score ?? calculateTrustScore({
    averageRating: Number(worker.average_rating) || 0,
    completionRate,
    responseReliability: Number(worker.response_rate) || 1,
    disputeCount,
    totalJobs: totalAssigned,
  });

  const { data: chainRecords } = await supabase
    .from('job_chain_records')
    .select('id, job_id, blockchain_hash, transaction_hash, created_at')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    worker_id: worker.id,
    trust_score: trustScore,
    blockchain_verified: Boolean(worker.blockchain_verified),
    verification_status: worker.verification_level || 'unverified',
    total_jobs_completed: totalCompleted,
    average_rating: Number(worker.average_rating) || 0,
    dispute_count: disputeCount,
    response_reliability: Number(worker.response_rate) || 1,
    blockchain_records: chainRecords || [],
  };
}

async function verifyJobOnChain(jobId) {
  const supabase = getSupabaseAdmin();

  const { data: record, error: recordError } = await supabase
    .from('job_chain_records')
    .select('*')
    .eq('job_id', jobId)
    .maybeSingle();

  if (recordError) throw recordError;
  if (!record) throw new Error('Blockchain record not found for this job');

  const { data: worker, error: workerError } = await supabase
    .from('workers')
    .select('id, name')
    .eq('id', record.worker_id)
    .maybeSingle();

  if (workerError) throw workerError;
  if (!worker) throw new Error('Worker not found');

  const recalculatedHash = generateSHA256RecordHash({
    jobId: record.job_id,
    workerId: record.worker_id,
    workerName: worker.name,
    trustScore: Number(record.trust_score_snapshot) || 0,
    timestamp: new Date(record.created_at).toISOString(),
  });

  const verified = recalculatedHash === record.blockchain_hash;

  return {
    job_id: jobId,
    verified,
    stored_record: record,
  };
}

module.exports = {
  recordCompletedJobOnChain,
  updateWorkerTrustScore,
  getWorkerPassport,
  verifyJobOnChain,
};
