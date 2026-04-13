const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4005;

app.use(cors());
app.use(express.json());

app.use('/', require('./routes/searchRoutes'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'search-service' });
});

app.listen(PORT, () => {
  console.log(`search-service running on port ${PORT}`);
});