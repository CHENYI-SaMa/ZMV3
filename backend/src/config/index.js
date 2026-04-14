'use strict';

require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  useLocalDb: process.env.USE_LOCAL_DB === 'true',

  cloudbase: {
    envId: process.env.CLOUDBASE_ENV_ID || '',
    secretId: process.env.CLOUDBASE_SECRET_ID || '',
    secretKey: process.env.CLOUDBASE_SECRET_KEY || ''
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'zhimai-default-secret-change-in-production',
    userExpiresIn: '7d',
    adminExpiresIn: '1d'
  },

  bcrypt: {
    saltRounds: 10
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  }
};

module.exports = config;
