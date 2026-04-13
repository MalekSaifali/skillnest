const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4003;

app.use(cors());
app.use(express.json());

app.use('/', require('./routes/connectRoutes'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'connect-service' });
});

app.listen(PORT, () => {
  console.log(`connect-service running on port ${PORT}`);
});