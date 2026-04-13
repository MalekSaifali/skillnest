const express = require('express');
const router = express.Router();
const pool = require('../db.js');

// ✅ SEND CONNECTION REQUEST
// Frontend calls: POST /api/connections/request  → maps to POST /send here
router.post('/send', async (req, res) => {
  try {
    const sender_id = req.headers['x-user-sub'];
    const { receiver_id } = req.body;

    if (!sender_id || !receiver_id) {
      return res.status(400).json({ error: 'sender_id and receiver_id required' });
    }

    // Check if already exists
    const existing = await pool.query(
      'SELECT id FROM connections WHERE (sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1)',
      [sender_id, receiver_id]
    );
    if (existing.rows.length > 0) {
      return res.json({ message: 'Request already exists' });
    }

    await pool.query(
      'INSERT INTO connections (sender_id, receiver_id, status) VALUES ($1, $2, $3)',
      [sender_id, receiver_id, 'pending']
    );
    res.json({ message: 'Request sent' });
  } catch (err) {
    console.error('Send error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ ALIAS: POST /request → same as /send (frontend calls this)
router.post('/request', async (req, res) => {
  try {
    const sender_id = req.headers['x-user-sub'];
    const { receiver_id } = req.body;

    if (!sender_id || !receiver_id) {
      return res.status(400).json({ error: 'sender_id and receiver_id required' });
    }

    const existing = await pool.query(
      'SELECT id FROM connections WHERE (sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1)',
      [sender_id, receiver_id]
    );
    if (existing.rows.length > 0) {
      return res.json({ message: 'Request already exists' });
    }

    await pool.query(
      'INSERT INTO connections (sender_id, receiver_id, status) VALUES ($1, $2, $3)',
      [sender_id, receiver_id, 'pending']
    );
    res.json({ message: 'Request sent' });
  } catch (err) {
    console.error('Request error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ ACCEPT REQUEST
router.put('/accept', async (req, res) => {
  try {
    const receiver_id = req.headers['x-user-sub'];
    const { sender_id } = req.body;
    await pool.query(
      'UPDATE connections SET status=$1 WHERE sender_id=$2 AND receiver_id=$3',
      ['accepted', sender_id, receiver_id]
    );
    res.json({ message: 'Request accepted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ REJECT REQUEST
router.put('/reject', async (req, res) => {
  try {
    const receiver_id = req.headers['x-user-sub'];
    const { sender_id } = req.body;
    await pool.query(
      'UPDATE connections SET status=$1 WHERE sender_id=$2 AND receiver_id=$3',
      ['rejected', sender_id, receiver_id]
    );
    res.json({ message: 'Request rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET MY CONNECTIONS STATUS (original)
router.get('/status', async (req, res) => {
  try {
    const user_id = req.headers['x-user-sub'];
    const result = await pool.query(
      'SELECT * FROM connections WHERE sender_id=$1 OR receiver_id=$1',
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ALIAS: GET /list → same as /status (frontend calls this)
router.get('/list', async (req, res) => {
  try {
    const user_id = req.headers['x-user-sub'];
    const result = await pool.query(
      `SELECT 
         c.id, c.sender_id as requester_id, c.receiver_id, c.status,
         c.created_at
       FROM connections c
       WHERE c.sender_id=$1 OR c.receiver_id=$1`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET INCOMING REQUESTS
router.get('/requests', async (req, res) => {
  try {
    const user_id = req.headers['x-user-sub'];
    const result = await pool.query(
      "SELECT * FROM connections WHERE receiver_id=$1 AND status='pending'",
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET CONNECTED USERS LIST (accepted connections only)
router.get('/connected', async (req, res) => {
  try {
    const user_id = req.headers['x-user-sub'];
    const result = await pool.query(
      `SELECT 
         CASE WHEN sender_id=$1 THEN receiver_id ELSE sender_id END as connected_user_id,
         status, created_at
       FROM connections
       WHERE (sender_id=$1 OR receiver_id=$1) AND status='accepted'`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;