'use strict';

// 腾讯云 SCF/CloudBase 云函数标准入口
const app = require('./app');

exports.main = async (event, context) => {
  const serverless = require('serverless-http');
  return serverless(app)(event, context);
};
