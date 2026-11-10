const { z } = require('zod');

const lineItemSchema = z.object({
  description: z.string().trim().min(1).max(200),
  quantity: z.number().int().min(1),
  unit_price_cents: z.number().int().min(0),
});

// Rejects impossible dates like 2026-02-31
const isRealDate = (s) => {
  const d = new Date(s);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

// Note: no totals here. The server calculates them.
const invoiceSchema = z.object({
  customer_id: z.number().int().min(1),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'due_date must be YYYY-MM-DD')
    .refine(isRealDate, 'due_date must be a real date'),
  line_items: z.array(lineItemSchema).min(1, 'at least one line item is required'),
});

// Body for PATCH /invoices/:id/status
const statusSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue']),
});

module.exports = { invoiceSchema, statusSchema };