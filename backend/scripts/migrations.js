const db = require('../config/db');

async function runMigrations() {
  console.log('Running migrations...');
  
  // Enable PostGIS extension
  await db.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);

  // Create Enums
  await db.query(`
    DO $$ BEGIN
      CREATE TYPE trade_category_enum AS ENUM ('plumber', 'electrician', 'carpenter', 'painter');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE verification_level_enum AS ENUM ('unverified', 'bronze', 'silver', 'gold');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE job_status_enum AS ENUM ('requested', 'matched', 'in_progress', 'completed', 'disputed');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create Tables
  await db.query(`
    CREATE TABLE IF NOT EXISTS workers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) UNIQUE NOT NULL,
      trade_category trade_category_enum NOT NULL,
      years_experience INT DEFAULT 0,
      location geometry(Point, 4326),
      availability_status BOOLEAN DEFAULT false,
      verification_level verification_level_enum DEFAULT 'unverified',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS worker_skills (
      worker_id INT REFERENCES workers(id) ON DELETE CASCADE,
      skill_name VARCHAR(100) NOT NULL,
      peer_review_count INT DEFAULT 0,
      video_url TEXT,
      PRIMARY KEY (worker_id, skill_name)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) UNIQUE NOT NULL,
      location geometry(Point, 4326),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      customer_id INT REFERENCES customers(id),
      worker_id INT REFERENCES workers(id),
      trade_category trade_category_enum NOT NULL,
      description TEXT,
      skill VARCHAR(100),
      intent VARCHAR(100),
      urgency VARCHAR(50),
      status job_status_enum DEFAULT 'requested',
      price_offered DECIMAL(10, 2),
      price_final DECIMAL(10, 2),
      escrow_payment_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS worker_ratings (
      id SERIAL PRIMARY KEY,
      worker_id INT REFERENCES workers(id),
      customer_id INT REFERENCES customers(id),
      job_id INT REFERENCES jobs(id),
      rating INT CHECK (rating >= 1 AND rating <= 5),
      review_text TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Migrations completed.');
}

runMigrations()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
