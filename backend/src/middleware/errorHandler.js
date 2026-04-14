'use strict';

const { serverError } = require('../utils/response');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[ErrorHandler]', err);
  const message = err.message || '服务器内部错误';
  const code = err.statusCode || err.status || 500;
  return serverError(res, message);
}

module.exports = errorHandler;
