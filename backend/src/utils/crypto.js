'use strict';

const bcrypt = require('bcryptjs');
const config = require('../config');

async function hashPassword(password) {
  return bcrypt.hash(password, config.bcrypt.saltRounds);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { hashPassword, comparePassword };
