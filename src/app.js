const express = require('express');

const app = express();
app.use(express.json()); // lets us read JSON request bodies

// Health check: used later by Docker and monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = app;