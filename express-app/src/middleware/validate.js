'use strict';
const { ZodError } = require('zod');

/**
 * validate(schema)
 * Express middleware — parses req.body through a Zod schema.
 * On failure returns 400 with structured error details.
 * On success replaces req.body with the parsed (sanitised) value.
 */
exports.validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      field:   i.path.join('.') || 'root',
      message: i.message,
    }));
    return res.status(400).json({ error: 'Validation failed', issues });
  }
  req.body = result.data;   // replace with parsed + stripped value
  next();
};
