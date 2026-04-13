const express = require('express');
const router = express.Router();
const es = require('../es');

// INDEX a user into Elasticsearch
router.post('/index', async (req, res) => {
  try {
    const { cognito_sub, name, email, bio, skills } = req.body;

    await es.index({
      index: 'users',
      id: cognito_sub,
      document: { cognito_sub, name, email, bio, skills: skills || [] }
    });

    res.json({ message: 'User indexed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// SEARCH users by name or skill
router.get('/users', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) return res.json([]);

    const result = await es.search({
      index: 'users',
      query: {
        multi_match: {
          query: q,
          fields: ['name', 'bio', 'skills'],
          fuzziness: 'AUTO'
        }
      }
    });

    const hits = result.hits.hits.map(h => h._source);
    res.json(hits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;