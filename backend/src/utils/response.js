'use strict';

/**
 * 统一响应格式工具
 * { code, data, message }
 */

function success(res, data = null, message = 'ok', code = 200) {
  return res.status(200).json({ code, data, message });
}

function failure(res, message = '请求失败', code = 400, httpStatus = 400) {
  return res.status(httpStatus).json({ code, data: null, message });
}

function unauthorized(res, message = '未授权，请先登录') {
  return failure(res, message, 401, 401);
}

function forbidden(res, message = '权限不足') {
  return failure(res, message, 403, 403);
}

function notFound(res, message = '资源不存在') {
  return failure(res, message, 404, 404);
}

function serverError(res, message = '服务器内部错误') {
  return failure(res, message, 500, 500);
}

module.exports = { success, failure, unauthorized, forbidden, notFound, serverError };
