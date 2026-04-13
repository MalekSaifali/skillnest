const express = require('express');
const router = express.Router();
const pool = require('../db.js');
const fetch = require('node-fetch');

// 🔍 Helper: Index user in Elasticsearch
async function indexUser(user) {
  try {
    await fetch('http://localhost:4005/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cognito_sub: user.cognito_sub,
        name: user.name,
        email: user.email,
        bio: user.bio || '',
        skills: user.skills || [],
        location: user.location || '',
        domain: user.domain || '',
        experience: user.experience_level || user.experience || ''
      })
    });
    console.log('✅ User indexed in Elasticsearch:', user.email);
  } catch (err) {
    console.error('⚠️ Elasticsearch index failed (non-critical):', err.message);
  }
}

// ✅ AI SEARCH PROXY
router.post('/ai-search', async (req, res) => {
  try {
    const { query, users } = req.body;
    if (!query || !users) return res.json([]);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `You are a smart user search assistant for a professional networking app called SkillNest.

The user typed this natural language search: "${query}"

Here is the list of available users (JSON):
${JSON.stringify(users.map(u => ({
  cognito_sub: u.cognito_sub,
  name: u.name,
  bio: u.bio,
  skills: u.skills,
  domain: u.domain,
  experience: u.experience,
  location: u.location
})))}

Return ONLY a JSON array of cognito_sub values of users that match the search query, ordered by relevance.
Example: ["sub1", "sub2"]
Return empty array [] if no match.
Return ONLY the JSON array, no explanation, no markdown.`
        }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    const matchedSubs = JSON.parse(clean);
    res.json(matchedSubs);
  } catch (err) {
    console.error('AI search error:', err.message);
    res.status(500).json({ error: 'AI search failed' });
  }
});

// ✅ GET CURRENT USER (AUTO-CREATE IF NOT EXISTS)
router.get('/me', async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const name = req.headers['x-user-name'] || 'User';
    const sub = req.headers['x-user-sub'];

    if (!email) return res.status(400).json({ message: 'Email not found in headers' });

    let result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);

    if (result.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO users (cognito_sub, name, email, last_active)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [sub, name, email]
      );
      await indexUser(result.rows[0]);
    } else {
      await pool.query('UPDATE users SET last_active=NOW() WHERE email=$1', [email]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error in /me:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ UPDATE PROFILE — FIXED: use experience_level column (matches your DB schema)
router.put('/update', async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    if (!email) return res.status(400).json({ message: 'Email missing in headers' });

    const {
      name, bio, skills, is_public,
      github_url, linkedin_url,
      skill_levels, experience_entries, projects,
      location, experience, domain
    } = req.body;

    // First check what columns actually exist to avoid 500
    const result = await pool.query(
      `UPDATE users
       SET name=$1,
           bio=$2,
           skills=$3,
           is_public=$4,
           github_url=$5,
           linkedin_url=$6,
           skill_levels=$7,
           experience=$8,
           projects=$9,
           location=$10,
           experience_level=$11,
           domain=$12,
           last_active=NOW()
       WHERE email=$13
       RETURNING *`,
      [
        name,
        bio,
        skills,
        is_public,
        github_url || null,
        linkedin_url || null,
        JSON.stringify(skill_levels || {}),
        JSON.stringify(experience_entries || []),
        JSON.stringify(projects || []),
        location || null,
        experience || null,
        domain || null,
        email
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await indexUser(result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error in /update:', err.message);

    // If column doesn't exist, try without the problematic columns
    if (err.message.includes('column') && err.message.includes('does not exist')) {
      console.error('❌ Column mismatch. Check your users table schema with: \\d users');
    }

    res.status(500).json({ error: 'Update failed', detail: err.message });
  }
});

// ✅ GET ALL USERS
router.get('/all', async (req, res) => {
  try {
    const currentUserEmail = req.headers['x-user-email'];
    const currentSub = req.headers['x-user-sub'];

    let blockedIds = [];
    if (currentSub) {
      const blockedRes = await pool.query(
        'SELECT blocked_id FROM blocked_users WHERE blocker_id=$1',
        [currentSub]
      );
      blockedIds = blockedRes.rows.map(r => r.blocked_id);
    }

    let query = `
      SELECT
        u.id, u.cognito_sub, u.name, u.email, u.bio, u.skills,
        u.location, u.experience_level as experience, u.domain,
        u.github_url, u.linkedin_url, u.skill_levels,
        u.last_active, u.is_public,
        0 AS follower_count,
        0 AS connection_count
      FROM users u
    `;

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (currentUserEmail) {
      conditions.push(`u.email != $${paramIdx++}`);
      params.push(currentUserEmail);
    }

    if (blockedIds.length > 0) {
      conditions.push(`u.cognito_sub != ALL($${paramIdx++})`);
      params.push(blockedIds);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY u.last_active DESC NULLS LAST';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ✅ GET ENDORSEMENTS FOR A USER
router.get('/endorsements/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT skill, COUNT(*) as count FROM endorsements WHERE endorsed_id=$1 GROUP BY skill`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ADD ENDORSEMENT
router.post('/endorse', async (req, res) => {
  try {
    const endorser_id = req.headers['x-user-sub'];
    const { endorsed_id, skill } = req.body;
    await pool.query(
      `INSERT INTO endorsements (endorser_id, endorsed_id, skill)
       VALUES ($1, $2, $3) ON CONFLICT (endorser_id, endorsed_id, skill) DO NOTHING`,
      [endorser_id, endorsed_id, skill]
    );
    res.json({ message: 'Endorsed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ REMOVE ENDORSEMENT
router.delete('/endorse', async (req, res) => {
  try {
    const endorser_id = req.headers['x-user-sub'];
    const { endorsed_id, skill } = req.body;
    await pool.query(
      `DELETE FROM endorsements WHERE endorser_id=$1 AND endorsed_id=$2 AND skill=$3`,
      [endorser_id, endorsed_id, skill]
    );
    res.json({ message: 'Endorsement removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET BOOKMARKS
router.get('/bookmarks', async (req, res) => {
  try {
    const user_id = req.headers['x-user-sub'];
    const result = await pool.query(
      `SELECT u.id, u.cognito_sub, u.name, u.email, u.bio, u.skills, u.location, u.domain
       FROM bookmarks b JOIN users u ON u.cognito_sub = b.bookmarked_id WHERE b.user_id=$1`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ TOGGLE BOOKMARK
router.post('/bookmark', async (req, res) => {
  try {
    const user_id = req.headers['x-user-sub'];
    const { bookmarked_id } = req.body;
    const existing = await pool.query(
      'SELECT id FROM bookmarks WHERE user_id=$1 AND bookmarked_id=$2',
      [user_id, bookmarked_id]
    );
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM bookmarks WHERE user_id=$1 AND bookmarked_id=$2', [user_id, bookmarked_id]);
      res.json({ bookmarked: false });
    } else {
      await pool.query('INSERT INTO bookmarks (user_id, bookmarked_id) VALUES ($1, $2)', [user_id, bookmarked_id]);
      res.json({ bookmarked: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ BLOCK USER — original route (body-based) kept for compatibility
router.post('/block', async (req, res) => {
  try {
    const blocker_id = req.headers['x-user-sub'];
    const { blocked_id } = req.body;
    await pool.query(
      `INSERT INTO blocked_users (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [blocker_id, blocked_id]
    );
    res.json({ message: 'User blocked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ BLOCK USER — URL param version (used by frontend: POST /block/:userId)
router.post('/block/:userId', async (req, res) => {
  try {
    const blocker_id = req.headers['x-user-sub'];
    const blocked_id = req.params.userId;
    await pool.query(
      `INSERT INTO blocked_users (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [blocker_id, blocked_id]
    );
    res.json({ message: 'User blocked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UNBLOCK USER — original route (body-based) kept for compatibility
router.delete('/block', async (req, res) => {
  try {
    const blocker_id = req.headers['x-user-sub'];
    const { blocked_id } = req.body;
    await pool.query(
      'DELETE FROM blocked_users WHERE blocker_id=$1 AND blocked_id=$2',
      [blocker_id, blocked_id]
    );
    res.json({ message: 'User unblocked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UNBLOCK USER — URL param version (used by frontend: DELETE /block/:userId)
router.delete('/block/:userId', async (req, res) => {
  try {
    const blocker_id = req.headers['x-user-sub'];
    const blocked_id = req.params.userId;
    await pool.query(
      'DELETE FROM blocked_users WHERE blocker_id=$1 AND blocked_id=$2',
      [blocker_id, blocked_id]
    );
    res.json({ message: 'User unblocked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET BLOCKED USERS LIST
router.get('/blocked', async (req, res) => {
  try {
    const blocker_id = req.headers['x-user-sub'];
    const result = await pool.query(
      `SELECT u.cognito_sub, u.name
       FROM users u
       INNER JOIN blocked_users b ON b.blocked_id = u.cognito_sub
       WHERE b.blocker_id = $1`,
      [blocker_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ SAVE USER (URL param version — used by frontend)
router.post('/save/:userId', async (req, res) => {
  try {
    const saver_id = req.headers['x-user-sub'];
    const saved_id = req.params.userId;
    await pool.query(
      `INSERT INTO saved_users (saver_id, saved_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [saver_id, saved_id]
    );
    res.json({ message: 'User saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UNSAVE USER (URL param version — used by frontend)
router.delete('/save/:userId', async (req, res) => {
  try {
    const saver_id = req.headers['x-user-sub'];
    const saved_id = req.params.userId;
    await pool.query(
      'DELETE FROM saved_users WHERE saver_id=$1 AND saved_id=$2',
      [saver_id, saved_id]
    );
    res.json({ message: 'User unsaved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET SAVED USERS LIST
router.get('/saved', async (req, res) => {
  try {
    const saver_id = req.headers['x-user-sub'];
    const result = await pool.query(
      `SELECT u.cognito_sub, u.name
       FROM users u
       INNER JOIN saved_users s ON s.saved_id = u.cognito_sub
       WHERE s.saver_id = $1`,
      [saver_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ REPORT USER
router.post('/report', async (req, res) => {
  try {
    const reporter_id = req.headers['x-user-sub'];
    const { reported_id, reason } = req.body;
    await pool.query(
      'INSERT INTO reports (reporter_id, reported_id, reason) VALUES ($1, $2, $3)',
      [reporter_id, reported_id, reason || 'No reason provided']
    );
    res.json({ message: 'Report submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET TRENDING SKILLS
router.get('/trending-skills', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT unnest(skills) AS skill, COUNT(*) AS count
       FROM users WHERE skills IS NOT NULL AND array_length(skills, 1) > 0
       GROUP BY skill ORDER BY count DESC LIMIT 10`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET TOP USERS
router.get('/top-users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cognito_sub, name, bio, skills, domain,
              array_length(skills, 1) AS skill_count, 0 AS follower_count
       FROM users WHERE skills IS NOT NULL
       ORDER BY array_length(skills, 1) DESC NULLS LAST LIMIT 5`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;