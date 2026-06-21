function normalizePercent(value) {
  if (typeof value !== 'number') value = Number(value) || 0;
  return Math.max(0, Math.min(1, value));
}

function calculateTrustScore({
  averageRating = 0,
  completionRate = 0,
  responseReliability = 1,
  disputeCount = 0,
  totalJobs = 0
}) {
  const ratingComponent = normalizePercent(averageRating / 5) * 40;
  const completionComponent = normalizePercent(completionRate) * 30;
  const responseComponent = normalizePercent(responseReliability) * 20;
  const disputeFactor = totalJobs > 0 ? normalizePercent(1 - disputeCount / totalJobs) : 1;
  const disputeComponent = disputeFactor * 10;
  const score = ratingComponent + completionComponent + responseComponent + disputeComponent;
  return Math.round(Math.max(0, Math.min(100, score)));
}

function calculateJobContribution({
  customerRating = 0,
  disputeStatus = false,
  responseReliability = 1
}) {
  const ratingComponent = normalizePercent(customerRating / 5) * 40;
  const completionComponent = 30; // completed jobs always contribute full completion credit
  const responseComponent = normalizePercent(responseReliability) * 20;
  const disputeComponent = disputeStatus ? 0 : 10;
  const score = ratingComponent + completionComponent + responseComponent + disputeComponent;
  return Math.round(Math.max(0, Math.min(100, score)));
}

module.exports = {
  calculateTrustScore,
  calculateJobContribution,
};
