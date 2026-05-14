const { getSupabaseAdmin } = require('../config/supabase');
const supabase = getSupabaseAdmin();

function calculateDistance(lat1, lon1, lat2, lon2) {
  // Haversine formula
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

async function matchWorkers(customerLat, customerLng, requiredSkill, customerPincode = null) {
  try {
    // 1. Query available workers from Supabase instead of local pg
    const { data: workers, error } = await supabase
      .from('workers')
      .select('id, name, trade_category, availability_status, trust_score, pincode')
      .eq('availability_status', true);

    if (error) throw error;

    if (!workers || workers.length === 0) {
      return [];
    }

    const hasCustomerLocation = customerLat != null && customerLng != null;

    const matchedWorkers = workers
      .filter((worker) => {
        // Ignore workers that have neither coordinates nor pincode
        if (worker.latitude == null && worker.longitude == null && worker.pincode == null) {
          return false;
        }
        return true;
      })
      .map((worker) => {
        // SKILL MATCH
        let skill_match = 0.3;
        // Case insensitive match
        if (worker.trade_category && worker.trade_category.toLowerCase() === requiredSkill.toLowerCase()) {
          skill_match = 1;
        }

        // DISTANCE SCORE
        let distance_km = null;
        let distance_score = 0.2;

        if (hasCustomerLocation && worker.latitude != null && worker.longitude != null) {
          distance_km = calculateDistance(customerLat, customerLng, worker.latitude, worker.longitude);
          if (distance_km <= 2) {
            distance_score = 1;
          } else if (distance_km <= 5) {
            distance_score = 0.8;
          } else if (distance_km <= 10) {
            distance_score = 0.5;
          } else {
            distance_score = 0.2;
          }
        } else if (worker.pincode != null && customerPincode != null) {
          // Fallback to pincode-based worker matching
          if (worker.pincode === customerPincode) {
            // Assume 5km average distance for same pincode
            distance_km = 5;
            distance_score = 0.8; 
          } else {
            // Assume 15km+ for different pincode
            distance_km = 15;
            distance_score = 0.2;
          }
        }

        // TRUST SCORE — normalize from 0-100 scale to 0-1
        const rawTrust = worker.trust_score != null ? Number(worker.trust_score) : 50;
        const trust_score = rawTrust > 1 ? rawTrust / 100 : rawTrust;

        // FINAL FORMULA
        const match_score = (0.4 * skill_match) + (0.3 * distance_score) + (0.3 * trust_score);

        return {
          id: worker.id,
          name: worker.name,
          skill_category: worker.skill_category,
          distance_km: distance_km !== null ? Number(distance_km.toFixed(1)) : null,
          trust_score: trust_score,
          match_score: Number(match_score.toFixed(2))
        };
      });

    // 5. Sort descending by match_score
    matchedWorkers.sort((a, b) => b.match_score - a.match_score);

    // 6. Return top 20 matching workers
    return matchedWorkers.slice(0, 20);
  } catch (error) {
    console.error('Error matching workers:', error);
    throw error;
  }
}

module.exports = {
  calculateDistance,
  matchWorkers
};
