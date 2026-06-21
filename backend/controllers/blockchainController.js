const { recordCompletedJobOnChain, updateWorkerTrustScore, getWorkerPassport, verifyJobOnChain } = require('../utils/blockchainJobRecorder');

const blockchainController = {
  recordJob: async (req, res) => {
    try {
      const { jobId, customerRating, disputeStatus, responseReliability } = req.body;
      if (!jobId) return res.status(400).json({ success: false, error: 'jobId is required' });

      const result = await recordCompletedJobOnChain(Number(jobId), {
        customerRating: customerRating != null ? Number(customerRating) : undefined,
        disputeStatus: disputeStatus != null ? Boolean(disputeStatus) : undefined,
        responseReliability: responseReliability != null ? Number(responseReliability) : undefined,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  updateTrustScore: async (req, res) => {
    try {
      const { workerId } = req.body;
      if (!workerId) return res.status(400).json({ success: false, error: 'workerId is required' });

      const passport = await updateWorkerTrustScore(Number(workerId));
      res.status(200).json({ success: true, data: passport });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getPassport: async (req, res) => {
    try {
      const { workerId } = req.params;
      if (!workerId) return res.status(400).json({ success: false, error: 'workerId is required' });

      const passport = await getWorkerPassport(Number(workerId));
      res.status(200).json({ success: true, data: passport });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  verifyJob: async (req, res) => {
    try {
      const { jobId } = req.params;
      if (!jobId) return res.status(400).json({ success: false, error: 'jobId is required' });

      const result = await verifyJobOnChain(Number(jobId));
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = blockchainController;
