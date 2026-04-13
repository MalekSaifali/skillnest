// Run this once to create all tables
const { Pool } = require('pg');

const dbs = [
  {
    name: 'user_db',
    url: 'postgresql://skillnest:skillnest123@localhost:5436/user_db',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        cognito_sub VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        bio TEXT,
        skills TEXT[],
        location VARCHAR(255),
        experience_level VARCHAR(255),
        domain VARCHAR(255),
        github_url VARCHAR(500),
        linkedin_url VARCHAR(500),
        skill_levels JSONB DEFAULT '{}',
        experience JSONB DEFAULT '[]',
        projects JSONB DEFAULT '[]',
        is_public BOOLEAN DEFAULT true,
        last_active TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS endorsements (
        id SERIAL PRIMARY KEY,
        endorser_id VARCHAR(255),
        endorsed_id VARCHAR(255),
        skill VARCHAR(255),
        UNIQUE(endorser_id, endorsed_id, skill)
      );
      CREATE TABLE IF NOT EXISTS bookmarks (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        bookmarked_id VARCHAR(255),
        UNIQUE(user_id, bookmarked_id)
      );
      CREATE TABLE IF NOT EXISTS blocked_users (
        id SERIAL PRIMARY KEY,
        blocker_id VARCHAR(255),
        blocked_id VARCHAR(255),
        UNIQUE(blocker_id, blocked_id)
      );
      CREATE TABLE IF NOT EXISTS saved_users (
        id SERIAL PRIMARY KEY,
        saver_id VARCHAR(255),
        saved_id VARCHAR(255),
        UNIQUE(saver_id, saved_id)
      );
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        reporter_id VARCHAR(255),
        reported_id VARCHAR(255),
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS auth_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `
  },
  {
    name: 'follow_db',
    url: 'postgresql://skillnest:skillnest123@localhost:5433/follow_db',
    sql: `
      CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY,
        follower_id VARCHAR(255),
        following_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(follower_id, following_id)
      );
    `
  },
  {
    name: 'connect_db',
    url: 'postgresql://skillnest:skillnest123@localhost:5434/connect_db',
    sql: `
      CREATE TABLE IF NOT EXISTS connections (
        id SERIAL PRIMARY KEY,
        sender_id VARCHAR(255),
        receiver_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `
  },
  {
    name: 'chat_db',
    url: 'postgresql://skillnest:skillnest123@localhost:5435/chat_db',
    sql: `
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id VARCHAR(255),
        receiver_id VARCHAR(255),
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        receiver_id VARCHAR(255),
        sender_id VARCHAR(255),
        sender_name VARCHAR(255),
        type VARCHAR(100),
        message TEXT,
        link VARCHAR(500),
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `
  }
];

async function init() {
  for (const db of dbs) {
    const pool = new Pool({ connectionString: db.url });
    try {
      await pool.query(db.sql);
      console.log(`✅ ${db.name} tables created`);
    } catch (err) {
      console.error(`❌ ${db.name} error:`, err.message);
    } finally {
      await pool.end();
    }
  }
  console.log('\n✅ All tables initialized! You can now start all services.');
}

init();
