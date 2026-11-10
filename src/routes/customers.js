const express = require('express');
const pool = require('../db/pool');
const { customerSchema } = require('../schemas/customer');
const asyncHandler = require('../utils/asyncHandler');
const { validateBody } = require('../utils/validate');
const router = express.Router();



// Runs for every route containing :id; rejects bad ids early
router.param('id', (req, res, next, value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  req.customerId = id;
  next();
});




// Create
router.post('/', asyncHandler(async (req, res) => {
  const data = validateBody(customerSchema, req, res);
  if (!data) return;
  try {
    const { rows } = await pool.query(
      'INSERT INTO customers (name, email) VALUES ($1, $2) RETURNING *',
      [data.name, data.email]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') { // unique violation
      return res.status(409).json({ error: 'Email already exists' });
    }
    throw err;
  }
}));

// List
router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM customers ORDER BY id');
  res.json(rows);
}));

// Read one
router.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1', [req.customerId]);
  if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
  res.json(rows[0]);
}));

// Update
router.put('/:id', asyncHandler(async (req, res) => {
  const data = validateBody(customerSchema, req, res);
  if (!data) return;
  try {
    const { rows } = await pool.query(
      'UPDATE customers SET name = $1, email = $2 WHERE id = $3 RETURNING *',
      [data.name, data.email, req.customerId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    throw err;
  }
}));

// Delete
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM customers WHERE id = $1', [req.customerId]);
    if (rowCount === 0) return res.status(404).json({ error: 'Customer not found' });
    res.status(204).send();
  } catch (err) {
    if (err.code === '23503') { // foreign key violation: customer has invoices
      return res.status(409).json({ error: 'Customer has invoices and cannot be deleted' });
    }
    throw err;
  }
}));

module.exports = router;