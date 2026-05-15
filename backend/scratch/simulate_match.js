const { matchWorkers } = require('./utils/matchWorkers');
require('dotenv').config();

async function simulate() {
  console.log('--- SIMULATING SEARCH ---');
  try {
    const results = await matchWorkers(null, null, 'plumber', '560059');
    console.log('MATCHED WORKERS:', JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('SEARCH CRASHED:', err);
  }
}

simulate();
