'use strict';

const config = require('../config');

let _db = null;

function getDb() {
  if (config.useLocalDb) {
    return require('./localDb');
  }

  if (!_db) {
    const cloudbase = require('@cloudbase/node-sdk');
    const app = cloudbase.init({
      env: config.cloudbase.envId,
      secretId: config.cloudbase.secretId,
      secretKey: config.cloudbase.secretKey
    });
    const db = app.database();

    // Wrap CloudBase db to match our local interface
    _db = {
      collection(name) {
        return db.collection(name);
      },
      generateId(prefix) {
        const num = String(Math.floor(Math.random() * 9000000) + 1000000);
        return `${prefix}${num}`;
      }
    };
  }

  return _db;
}

module.exports = { getDb };
