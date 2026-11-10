const { z } = require('zod');

// Shape every customer request body must have
const customerSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(100),
  email: z.string().trim().toLowerCase().email('invalid email'),
});

module.exports = { customerSchema };