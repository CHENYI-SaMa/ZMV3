'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');

function signUserToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.userExpiresIn });
}

function signAdminToken(payload) {
  return jwt.sign({ ...payload, role: 'admin' }, config.jwt.secret, {
    expiresIn: config.jwt.adminExpiresIn
  });
}

function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = { signUserToken, signAdminToken, verifyToken };
