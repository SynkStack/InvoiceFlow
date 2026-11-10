const express = require('express');
const pool = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const { validateQuery } = require('../utils/validate');
const { invoiceFilterSchema } = require('../schemas/invoiceFilter');
const { buildInvoiceFilter } = require('../services/invoiceQuery');

const router = express.Router();

// GET /invoices?status=sent&customer_id=1&due_before=2026-12-31&limit=20&offset=0
router.get('/', asyncHandler(async (req, res) => {
  const q = validateQuery(invoiceFilterSchema, req, res);
  if (!q) return;

  const { where, params } = buildInvoiceFilter(q);

  const list = await pool.query(
    `SELECT * FROM invoices ${where}
     ORDER BY id LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, q.limit, q.offset]
  );
  const count = await pool.query(
    `SELECT count(*)::int AS total FROM invoices ${where}`,
    params
  );

  res.json({ data: list.rows, total: count.rows[0].total, limit: q.limit, offset: q.offset });
}));

module.exports = router;