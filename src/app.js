const express = require('express');

const app = express();
app.use(express.json()); // lets us read JSON request bodies

// Health check: used later by Docker and monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/customers', require('./routes/customers'));

// Must be last; Express recognizes it by its 4 arguments
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;