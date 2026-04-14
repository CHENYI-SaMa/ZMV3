'use strict';

require('dotenv').config();

const app = require('./app');
const config = require('./config');

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`[织麦API] 服务已启动: http://localhost:${PORT}`);
  console.log(`[织麦API] 环境: ${config.nodeEnv}`);
  console.log(`[织麦API] 本地DB模式: ${config.useLocalDb}`);
  console.log(`[织麦API] 健康检查: http://localhost:${PORT}/health`);
});

module.exports = app;
