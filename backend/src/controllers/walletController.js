'use strict';

const { getDb } = require('../db');
const { success, failure } = require('../utils/response');

async function getWallet(req, res, next) {
  try {
    const db = getDb();
    const userId = req.user.id;

    let walletResult = db.collection('wallets').doc(userId).get();
    if (!walletResult.data) {
      // Create wallet if not exists
      const now = new Date().toISOString();
      db.collection('wallets').add({
        _id: userId,
        userId,
        balance: 0,
        transactions: [],
        createdAt: now
      });
      walletResult = db.collection('wallets').doc(userId).get();
    }

    return success(res, walletResult.data);
  } catch (err) {
    return next(err);
  }
}

async function recharge(req, res, next) {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { amount, paymentMethod } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return failure(res, '充值金额不合法');
    }
    if (!paymentMethod || !['wechat', 'alipay'].includes(paymentMethod)) {
      return failure(res, '请选择充值方式');
    }

    // 预留接口 – 实际需要接入支付渠道
    // Return payment params for frontend to complete payment
    const paymentParams = {
      rechargeId: `rch_${Date.now()}`,
      userId,
      amount: parsedAmount,
      paymentMethod,
      payUrl: `https://pay.example.com/recharge?user=${userId}&amount=${parsedAmount}`,
      expiredAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };

    return success(res, paymentParams, '请完成充值支付');
  } catch (err) {
    return next(err);
  }
}

module.exports = { getWallet, recharge };
