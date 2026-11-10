const { z } = require('zod');

// Same check as in invoice.js (small duplication we can share later)
const isRealDate = (s) => {
  const d = new Date(s);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')
  .refine(isRealDate, 'must be a real date');

// Query strings are always text, so numbers use z.coerce
const invoiceFilterSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue']).optional(),
  customer_id: z.coerce.number().int().min(1).optional(),
  due_after: dateString.optional(),
  due_before: dateString.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

module.exports = { invoiceFilterSchema };