const { requireAdmin } = require('../../../server/lib/auth');
const { sendError, requireMethod } = require('../../../server/lib/errors');

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['GET'])) return;

  try {
    const admin = await requireAdmin(req);
    res.status(200).json({ isAdmin: true, email: admin.email });
  } catch (error) {
    sendError(res, error);
  }
};
