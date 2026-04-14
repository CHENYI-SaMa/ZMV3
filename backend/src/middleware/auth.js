'use strict';

const { verifyToken } = require('../utils/jwt');
const { unauthorized, forbidden } = require('../utils/response');

/**
 * 验证 JWT token，将 decoded payload 挂到 req.user
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res);
  }
  const token = authHeader.slice(7);
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch {
    return unauthorized(res, 'Token 无效或已过期');
  }
}

/**
 * 验证管理员权限（role: 'admin'）
 */
function authenticateAdmin(req, res, next) {
  authenticate(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    return forbidden(res, '需要管理员权限');
  });
}

module.exports = { authenticate, authenticateAdmin };
