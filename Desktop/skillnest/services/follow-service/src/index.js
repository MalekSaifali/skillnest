const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

// ✅ IMPORTANT: NO /api/follow here
app.use('/', require('./routes/followRoutes'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'follow-service' });
});

app.listen(PORT, () => {
  console.log(`follow-service running on port ${PORT}`);
});