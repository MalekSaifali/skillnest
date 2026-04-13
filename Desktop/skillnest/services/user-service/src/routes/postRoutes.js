const express = require('express');
const router = express.Router();
const pool = require('../db.js');

// GET ALL POSTS (feed)
router.get('/', async (req, res) => {
  try {
    const posts = await pool.query(
      `SELECT p.*, 
        (SELECT json_agg(c ORDER BY c.created_at ASC) 
         FROM post_comments c WHERE c.post_id = p.id) as comments
       FROM posts p ORDER BY p.created_at DESC LIMIT 50`
    );
    res.json(posts.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE POST
router.post('/', async (req, res) => {
  try {
    const author_id = req.headers['x-user-sub'];
    const author_name = req.headers['x-user-name'];
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
    const result = await pool.query(
      'INSERT INTO posts (author_id, author_name, content) VALUES ($1,$2,$3) RETURNING *',
      [author_id, author_name, content.trim()]
    );
    res.status(201).json({ ...result.rows[0], comments: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LIKE / UNLIKE POST
router.post('/:id/like', async (req, res) => {
  try {
    const user_id = req.headers['x-user-sub'];
    const { id } = req.params;
    const post = await pool.query('SELECT likes FROM posts WHERE id=$1', [id]);
    if (!post.rows.length) return res.status(404).json({ error: 'Post not found' });
    let likes = post.rows[0].likes || [];
    if (likes.includes(user_id)) {
      likes = likes.filter((l) => l !== user_id);
    } else {
      likes.push(user_id);
    }
    await pool.query('UPDATE posts SET likes=$1 WHERE id=$2', [likes, id]);
    res.json({ likes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD COMMENT
router.post('/:id/comment', async (req, res) => {
  try {
    const author_id = req.headers['x-user-sub'];
    const author_name = req.headers['x-user-name'];
    const { id } = req.params;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
    const result = await pool.query(
      'INSERT INTO post_comments (post_id, author_id, author_name, content) VALUES ($1,$2,$3,$4) RETURNING *',
      [id, author_id, author_name, content.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE POST (only author)
router.delete('/:id', async (req, res) => {
  try {
    const user_id = req.headers['x-user-sub'];
    const { id } = req.params;
    await pool.query('DELETE FROM posts WHERE id=$1 AND author_id=$2', [id, user_id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
