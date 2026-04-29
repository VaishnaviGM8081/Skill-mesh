const db = require('../db');

const BENGALURU_LOCATIONS = [
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { name: 'BTM Layout', lat: 12.9166, lng: 77.6101 },
  { name: 'HSR Layout', lat: 12.9121, lng: 77.6446 },
  { name: 'Indiranagar', lat: 12.9719, lng: 77.6412 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7499 }
];

const TRADES = ['plumber', 'electrician', 'carpenter', 'painter'];

async function seed() {
  console.log('Starting DB Seed...');

  for (let i = 1; i <= 5; i++) {
    const loc = BENGALURU_LOCATIONS[i % 5];
    await db.query(`
      INSERT INTO customers (name, phone, location)
      VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326))
      ON CONFLICT (phone) DO NOTHING
    `, [`Customer ${i}`, `100000000${i}`, loc.lng, loc.lat]);
  }

  for (let i = 1; i <= 20; i++) {
    const loc = BENGALURU_LOCATIONS[i % 5];
    const trade = TRADES[i % 4];
    await db.query(`
      INSERT INTO workers (name, phone, trade_category, years_experience, availability_status, location, verification_level)
      VALUES ($1, $2, $3, $4, true, ST_SetSRID(ST_MakePoint($5, $6), 4326), 'silver')
      ON CONFLICT (phone) DO NOTHING
    `, [`Worker ${i}`, `90000000${i < 10 ? '0' + i : i}`, trade, Math.floor(Math.random() * 10) + 1, loc.lng, loc.lat]);
  }

  console.log('Seeded 5 customers and 20 workers. Exiting.');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
console.log("DB USER:", process.env.DB_USER);