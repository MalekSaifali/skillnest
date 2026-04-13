const express = require('express');
const router = express.Router();
const pool = require('../db.js');

// GET unread count — must be before /:id
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.headers['x-user-sub'];
    const result = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE receiver_id = $1 AND is_read = false`,
      [userId]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MARK all as read — must be before /:id
router.put('/mark-read', async (req, res) => {
  try {
    const userId = req.headers['x-user-sub'];
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE receiver_id = $1`,
      [userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all notifications for current user
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-sub'];
    const result = await pool.query(
      `SELECT * FROM notifications WHERE receiver_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// MARK single notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const userId = req.headers['x-user-sub'];
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND receiver_id = $2`,
      [req.params.id, userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a notification
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-sub'];
    await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND receiver_id = $2`,
      [req.params.id, userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
