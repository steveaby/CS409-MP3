const ok = (res, data, message = 'OK', status = 200) =>
  res.status(status).json({ message, data });

const created = (res, data, message = 'Created') => ok(res, data, message, 201);
const noContent = (res, message = 'No Content') => res.status(204).json({ message, data: null });

const badRequest = (res, message = 'Bad Request', data = null) =>
  res.status(400).json({ message, data });
const notFound = (res, message = 'Not Found', data = null) =>
  res.status(404).json({ message, data });
const serverError = (res, message = 'Server Error', data = null) =>
  res.status(500).json({ message, data });

const errorHandler = (err, req, res, next) => {
  if (err?.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => e.message);
    return badRequest(res, details.join('; '));
  }
  if (err?.code === 11000) { // duplicate key
    return badRequest(res, 'email must be unique');
  }
  return serverError(res, err?.message || 'Unexpected error');
};

module.exports = { ok, created, noContent, badRequest, notFound, serverError, errorHandler };
