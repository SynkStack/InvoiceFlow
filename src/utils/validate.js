// Parses input with a Zod schema.
// Returns clean data, or sends a 400 and returns null.
function parse(schema, input, res) {
  const result = schema.safeParse(input);
  if (!result.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    });
    return null;
  }
  return result.data;
}

const validateBody = (schema, req, res) => parse(schema, req.body, res);
const validateQuery = (schema, req, res) => parse(schema, req.query, res);

module.exports = { validateBody, validateQuery };