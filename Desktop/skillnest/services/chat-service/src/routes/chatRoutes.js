const express = require('express');
const router = express.Router();
const pool = require('../db.js');

// SEND MESSAGE
router.post('/send', async (req, res) => {
  try {
    const sender_id = req.headers['x-user-sub'];
    const { receiver_id, message } = req.body;

    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, message) VALUES ($1, $2, $3) RETURNING *',
      [sender_id, receiver_id, message]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET MESSAGES BETWEEN TWO USERS
router.get('/messages/:otherUserId', async (req, res) => {
  try {
    const my_id = req.headers['x-user-sub'];
    const { otherUserId } = req.params;

    const result = await pool.query(
      `SELECT * FROM messages 
       WHERE (sender_id=$1 AND receiver_id=$2)
       OR (sender_id=$2 AND receiver_id=$1)
       ORDER BY created_at ASC`,
      [my_id, otherUserId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET MY CONVERSATIONS (list of people I chatted with)
router.get('/conversations', async (req, res) => {
  try {
    const my_id = req.headers['x-user-sub'];

    const result = await pool.query(
      `SELECT DISTINCT 
        CASE WHEN sender_id=$1 THEN receiver_id ELSE sender_id END as other_user_id,
        MAX(created_at) as last_message_time
       FROM messages
       WHERE sender_id=$1 OR receiver_id=$1
       GROUP BY other_user_id
       ORDER BY last_message_time DESC`,
      [my_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;