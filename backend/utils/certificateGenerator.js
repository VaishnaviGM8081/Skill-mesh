const generateWorkerCertificate = (worker, job, chainRecord) => {
  const issueDate = new Date(chainRecord.created_at || Date.now()).toISOString().split('T')[0];
  return {
    certificate_id: `SM-CERT-${job.id}-${worker.id}`,
    worker_name: worker.name,
    trade_category: worker.trade_category || 'Unknown',
    completed_job_id: job.id,
    trust_score: worker.trust_score ?? 0,
    blockchain_hash: chainRecord.blockchain_hash,
    issue_date: issueDate,
    certificate_title: 'SkillMesh Verified Trust Certificate',
  };
};

module.exports = {
  generateWorkerCertificate,
};
