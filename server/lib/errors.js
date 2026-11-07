class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

function sendError(res, error) {
  const status = error instanceof HttpError ? error.status : 500;

  if (status >= 500) {
    console.error('[Golden Rewards API]', error);
  }

  res.status(status).json({
    error: status >= 500 ? 'Something went wrong. Please try again later.' : error.message,
  });
}

function requireMethod(req, res, allowed) {
  if (!allowed.includes(req.method)) {
    res.setHeader('Allow', allowed.join(', '));
    res.status(405).json({ error: 'Method not allowed.' });
    return false;
  }

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return true;
}

function getBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (_) {
      return {};
    }
  }
  return {};
}

module.exports = { HttpError, sendError, requireMethod, getBody };
