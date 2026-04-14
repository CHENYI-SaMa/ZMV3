'use strict';

const { getDb } = require('../db');
const { hashPassword, comparePassword } = require('../utils/crypto');
const { success, failure, notFound } = require('../utils/response');

async function getProfile(req, res, next) {
  try {
    const db = getDb();
    const userId = req.user.id;
    const result = db.collection('users').doc(userId).get();

    if (!result.data) {
      return notFound(res, '用户不存在');
    }

    const { passwordHash: _, paymentPasswordHash: __, ...safeUser } = result.data;
    return success(res, safeUser);
  } catch (err) {
    return next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { nickname, avatar } = req.body;

    const result = db.collection('users').doc(userId).get();
    if (!result.data) {
      return notFound(res, '用户不存在');
    }

    const updates = { updatedAt: new Date().toISOString() };
    if (nickname !== undefined) {
      if (typeof nickname !== 'string' || nickname.length < 2 || nickname.length > 16) {
        return failure(res, '昵称长度必须为 2-16 位');
      }
      updates.nickname = nickname;
    }
    if (avatar !== undefined) {
      updates.avatar = avatar;
    }

    db.collection('users').doc(userId).update({ $set: updates });

    const updated = db.collection('users').doc(userId).get();
    const { passwordHash: _, paymentPasswordHash: __, ...safeUser } = updated.data;
    return success(res, safeUser, '个人信息已更新');
  } catch (err) {
    return next(err);
  }
}

async function setPaymentPassword(req, res, next) {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { currentPassword, newPaymentPassword } = req.body;

    if (!newPaymentPassword || newPaymentPassword.length < 6 || newPaymentPassword.length > 20) {
      return failure(res, '支付密码长度必须为 6-20 位');
    }

    const result = db.collection('users').doc(userId).get();
    if (!result.data) {
      return notFound(res, '用户不存在');
    }

    const user = result.data;

    // If user already has payment password, verify current password
    if (user.paymentPasswordHash) {
      if (!currentPassword) {
        return failure(res, '请输入当前支付密码');
      }
      const valid = await comparePassword(currentPassword, user.paymentPasswordHash);
      if (!valid) {
        return failure(res, '当前支付密码不正确');
      }
    }

    const paymentPasswordHash = await hashPassword(newPaymentPassword);
    db.collection('users').doc(userId).update({
      $set: { paymentPasswordHash, updatedAt: new Date().toISOString() }
    });

    return success(res, null, '支付密码设置成功');
  } catch (err) {
    return next(err);
  }
}

async function realNameAuth(req, res, next) {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { name, idCard } = req.body;

    if (!name || name.trim().length < 2) {
      return failure(res, '请输入真实姓名');
    }
    if (!idCard || !/^\d{17}[\dXx]$/.test(idCard)) {
      return failure(res, '身份证号格式不正确');
    }

    const result = db.collection('users').doc(userId).get();
    if (!result.data) {
      return notFound(res, '用户不存在');
    }

    if (result.data.isRealNameVerified) {
      return failure(res, '已完成实名认证，无需重复操作');
    }

    db.collection('users').doc(userId).update({
      $set: {
        realName: name.trim(),
        idCard: idCard.toUpperCase(),
        isRealNameVerified: true,
        updatedAt: new Date().toISOString()
      }
    });

    return success(res, null, '实名认证成功');
  } catch (err) {
    return next(err);
  }
}

module.exports = { getProfile, updateProfile, setPaymentPassword, realNameAuth };
