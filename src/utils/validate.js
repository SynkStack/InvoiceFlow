// Parses req.body with a Zod schema.
// Returns clean data, or sends a 400 and returns null.
function validateBody(schema, req, res) {
  const result = schema.safeParse(req.body);
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

module.exports = { validateBody };