'use strict';

const { getDb } = require('../db');
const { hashPassword, comparePassword } = require('../utils/crypto');
const { signUserToken } = require('../utils/jwt');
const { success, failure } = require('../utils/response');

const PHONE_RE = /^1[3-9]\d{9}$/;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 20;
const USERNAME_MIN = 2;
const USERNAME_MAX = 16;

async function register(req, res, next) {
  try {
    const { phone, password, username } = req.body;

    if (!phone || !PHONE_RE.test(phone)) {
      return failure(res, '手机号格式不正确');
    }
    if (!password || password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
      return failure(res, `密码长度必须为 ${PASSWORD_MIN}-${PASSWORD_MAX} 位`);
    }
    if (!username || username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
      return failure(res, `用户名长度必须为 ${USERNAME_MIN}-${USERNAME_MAX} 位`);
    }

    const db = getDb();
    const existing = db.collection('users').where({ phone }).getOne();
    if (existing.data) {
      return failure(res, '该手机号已注册');
    }

    const passwordHash = await hashPassword(password);
    const id = `ZM${String(db.collection('users').get().data.length + 1).padStart(7, '0')}`;
    const now = new Date().toISOString();

    const user = {
      _id: id,
      id,
      phone,
      username,
      nickname: username,
      avatar: '',
      passwordHash,
      balance: 0,
      realName: '',
      idCard: '',
      isRealNameVerified: false,
      paymentPasswordHash: '',
      createdAt: now
    };

    db.collection('users').add(user);

    // Create wallet
    db.collection('wallets').add({
      _id: id,
      userId: id,
      balance: 0,
      transactions: [],
      createdAt: now
    });

    const token = signUserToken({ id, phone, username });
    const { passwordHash: _, paymentPasswordHash: __, ...safeUser } = user;

    return success(res, { token, user: safeUser }, '注册成功');
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { phone, password } = req.body;

    if (!phone || !PHONE_RE.test(phone)) {
      return failure(res, '手机号格式不正确');
    }
    if (!password) {
      return failure(res, '请输入密码');
    }

    const db = getDb();
    const result = db.collection('users').where({ phone }).getOne();
    if (!result.data) {
      return failure(res, '手机号或密码错误');
    }

    const user = result.data;
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return failure(res, '手机号或密码错误');
    }

    const token = signUserToken({ id: user.id || user._id, phone: user.phone, username: user.username });
    const { passwordHash: _, paymentPasswordHash: __, ...safeUser } = user;

    return success(res, { token, user: safeUser }, '登录成功');
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    // JWT is stateless; client should discard token
    return success(res, null, '已退出登录');
  } catch (err) {
    return next(err);
  }
}

async function sendSms(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone || !PHONE_RE.test(phone)) {
      return failure(res, '手机号格式不正确');
    }

    // 预留接口 - 实际接入短信服务时在此实现
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const db = getDb();
    const now = new Date().toISOString();
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Store code (remove any existing code for same phone first)
    db.collection('sms_codes').where({ phone }).remove();
    db.collection('sms_codes').add({ phone, code, expiredAt, createdAt: now });

    // In production: send real SMS via Tencent Cloud SMS SDK
    // For now, log to console (development only)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SMS] Phone: ${phone}, Code: ${code}`);
    }

    return success(res, null, '验证码已发送');
  } catch (err) {
    return next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { phone, code, newPassword } = req.body;

    if (!phone || !PHONE_RE.test(phone)) {
      return failure(res, '手机号格式不正确');
    }
    if (!code) {
      return failure(res, '请输入验证码');
    }
    if (!newPassword || newPassword.length < PASSWORD_MIN || newPassword.length > PASSWORD_MAX) {
      return failure(res, `密码长度必须为 ${PASSWORD_MIN}-${PASSWORD_MAX} 位`);
    }

    const db = getDb();

    // Verify SMS code
    const smsResult = db.collection('sms_codes').where({ phone, code }).getOne();
    if (!smsResult.data) {
      return failure(res, '验证码错误或已失效');
    }
    const smsRecord = smsResult.data;
    if (new Date() > new Date(smsRecord.expiredAt)) {
      db.collection('sms_codes').where({ phone }).remove();
      return failure(res, '验证码已过期，请重新获取');
    }

    // Find user
    const userResult = db.collection('users').where({ phone }).getOne();
    if (!userResult.data) {
      return failure(res, '该手机号未注册');
    }

    const passwordHash = await hashPassword(newPassword);
    const userId = userResult.data._id;
    db.collection('users').doc(userId).update({ $set: { passwordHash, updatedAt: new Date().toISOString() } });

    // Remove used code
    db.collection('sms_codes').where({ phone }).remove();

    return success(res, null, '密码重置成功');
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, logout, sendSms, resetPassword };
