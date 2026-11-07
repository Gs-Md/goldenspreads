
const handlers = {
  // Customer endpoints
  health: require('../server/api/loyalty/health'),
  me: require('../server/api/loyalty/me'),
  profile: require('../server/api/loyalty/profile'),
  redeem: require('../server/api/loyalty/redeem'),

  // Administrator endpoints
  'admin/award': require('../server/api/loyalty/admin/award'),
  'admin/confirm-redemption': require('../server/api/loyalty/admin/confirm-redemption'),
  'admin/customers': require('../server/api/loyalty/admin/customers'),
  'admin/delete-customer': require('../server/api/loyalty/admin/delete-customer'),
  'admin/redemptions': require('../server/api/loyalty/admin/redemptions'),
  'admin/status': require('../server/api/loyalty/admin/status'),

  // Authentication endpoints
  'auth/finish-signup': require('../server/api/loyalty/auth/finish-signup'),
  'auth/logout': require('../server/api/loyalty/auth/logout'),
  'auth/start': require('../server/api/loyalty/auth/start'),
  'auth/status': require('../server/api/loyalty/auth/status'),
  'auth/verify': require('../server/api/loyalty/auth/verify'),
};

module.exports = async function loyaltyRouter(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const rawRoute = req.query?.route;

  const route = (
    Array.isArray(rawRoute)
      ? rawRoute.join('/')
      : String(rawRoute || '')
  )
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();

  if (!Object.prototype.hasOwnProperty.call(handlers, route)) {
    return res.status(404).json({
      error: 'Golden Rewards endpoint not found.',
    });
  }

  try {
    await handlers[route](req, res);
  } catch (error) {
    console.error('Golden Rewards router error:', error);

    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal server error.',
      });
    }
  }
};
