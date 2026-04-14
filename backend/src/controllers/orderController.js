'use strict';

const { getDb } = require('../db');
const { comparePassword } = require('../utils/crypto');
const { success, failure, notFound, forbidden } = require('../utils/response');

const STATUS_TEXT_MAP = {
  pending: '待支付',
  paying: '支付中',
  paid: '已支付',
  failed: '支付失败',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款'
};

const CANCELLABLE_STATUSES = new Set(['pending', 'paying']);
const PAYMENT_METHODS = new Set(['wechat', 'alipay', 'balance']);

function generateOrderNo() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  return `ZM${date}${random}`;
}

async function createOrder(req, res, next) {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { productId, quantity = 1, paymentMethod, contactPhone, remark, couponId } = req.body;

    if (!productId) {
      return failure(res, '商品ID不能为空');
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return failure(res, '购买数量不合法');
    }
    if (paymentMethod && !PAYMENT_METHODS.has(paymentMethod)) {
      return failure(res, '不支持的支付方式');
    }

    // Get product
    let productResult = db.collection('products').doc(productId).get();
    if (!productResult.data) {
      const numericId = parseInt(productId, 10);
      if (!isNaN(numericId)) {
        productResult = db.collection('products').where({ id: numericId }).getOne();
      }
    }
    if (!productResult.data) {
      return notFound(res, '商品不存在');
    }
    const product = productResult.data;
    if (product.status !== 1) {
      return failure(res, '商品已下架');
    }
    if (product.stock < qty) {
      return failure(res, '商品库存不足');
    }

    const price = product.price;
    const subtotal = price * qty;
    let discount = 0;

    // Apply coupon (placeholder – in production verify coupon)
    if (couponId) {
      discount = 0; // TODO: implement coupon discount logic
    }

    const totalAmount = Math.max(0, subtotal - discount);
    const now = new Date().toISOString();
    const orderId = generateOrderNo();

    const order = {
      _id: orderId,
      id: orderId,
      orderNo: orderId,
      userId,
      productId: product._id,
      productName: product.name,
      price,
      quantity: qty,
      subtotal,
      discount,
      totalAmount,
      paymentMethod: paymentMethod || 'wechat',
      status: 'pending',
      statusText: STATUS_TEXT_MAP['pending'],
      contactPhone: contactPhone || '',
      remark: remark || '',
      couponId: couponId || '',
      createdAt: now,
      updatedAt: now,
      paidAt: ''
    };

    db.collection('orders').add(order);

    return success(res, order, '订单创建成功', 200);
  } catch (err) {
    return next(err);
  }
}

async function getOrderList(req, res, next) {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { status, page = 1, pageSize = 10 } = req.query;

    const query = { userId };
    if (status) query.status = status;

    const allResult = db.collection('orders').where(query).get();
    const total = allResult.data.length;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const skip = (pageNum - 1) * pageSizeNum;

    const items = allResult.data
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + pageSizeNum);

    return success(res, { total, page: pageNum, pageSize: pageSizeNum, items });
  } catch (err) {
    return next(err);
  }
}

async function getOrderDetail(req, res, next) {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { orderId } = req.params;

    const result = db.collection('orders').doc(orderId).get();
    if (!result.data) {
      return notFound(res, '订单不存在');
    }
    if (result.data.userId !== userId) {
      return forbidden(res, '无权访问该订单');
    }

    return success(res, result.data);
  } catch (err) {
    return next(err);
  }
}

async function payOrder(req, res, next) {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { orderId } = req.params;
    const { paymentMethod, paymentPassword } = req.body;

    const orderResult = db.collection('orders').doc(orderId).get();
    if (!orderResult.data) {
      return notFound(res, '订单不存在');
    }
    const order = orderResult.data;
    if (order.userId !== userId) {
      return forbidden(res, '无权操作该订单');
    }
    if (order.status !== 'pending') {
      return failure(res, `订单状态为"${order.statusText}"，无法支付`);
    }

    const method = paymentMethod || order.paymentMethod;
    if (!PAYMENT_METHODS.has(method)) {
      return failure(res, '不支持的支付方式');
    }

    const now = new Date().toISOString();

    if (method === 'balance') {
      // Verify payment password
      const userResult = db.collection('users').doc(userId).get();
      const user = userResult.data;
      if (!user) {
        return notFound(res, '用户不存在');
      }
      if (!user.paymentPasswordHash) {
        return failure(res, '请先设置支付密码');
      }
      if (!paymentPassword) {
        return failure(res, '请输入支付密码');
      }
      const valid = await comparePassword(paymentPassword, user.paymentPasswordHash);
      if (!valid) {
        return failure(res, '支付密码不正确');
      }

      // Check balance
      const walletResult = db.collection('wallets').doc(userId).get();
      const wallet = walletResult.data || { balance: 0, transactions: [] };
      if (wallet.balance < order.totalAmount) {
        return failure(res, '余额不足，请充值后再试');
      }

      // Deduct balance
      const newBalance = wallet.balance - order.totalAmount;
      const transaction = {
        id: `txn_${Date.now()}`,
        type: 'payment',
        amount: -order.totalAmount,
        orderId,
        createdAt: now
      };
      const transactions = [...(wallet.transactions || []), transaction];
      db.collection('wallets').doc(userId).update({
        $set: { balance: newBalance, transactions, updatedAt: now }
      });
      db.collection('users').doc(userId).update({ $set: { balance: newBalance } });

      // Update order to paid
      db.collection('orders').doc(orderId).update({
        $set: {
          status: 'paid',
          statusText: STATUS_TEXT_MAP['paid'],
          paymentMethod: method,
          paidAt: now,
          updatedAt: now
        }
      });

      const updated = db.collection('orders').doc(orderId).get();
      return success(res, updated.data, '支付成功');
    }

    // For wechat/alipay: set to paying status, return payment params
    db.collection('orders').doc(orderId).update({
      $set: {
        status: 'paying',
        statusText: STATUS_TEXT_MAP['paying'],
        paymentMethod: method,
        updatedAt: now
      }
    });

    // In production: integrate with WeChat Pay / Alipay SDK here
    const paymentParams = {
      orderId,
      orderNo: order.orderNo,
      amount: order.totalAmount,
      method,
      // Placeholder payment params
      payUrl: `https://pay.example.com/pay?order=${orderId}`,
      expiredAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };

    return success(res, paymentParams, '请完成支付');
  } catch (err) {
    return next(err);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { orderId } = req.params;

    const orderResult = db.collection('orders').doc(orderId).get();
    if (!orderResult.data) {
      return notFound(res, '订单不存在');
    }
    const order = orderResult.data;
    if (order.userId !== userId) {
      return forbidden(res, '无权操作该订单');
    }
    if (!CANCELLABLE_STATUSES.has(order.status)) {
      return failure(res, `订单状态为"${order.statusText}"，无法取消`);
    }

    const now = new Date().toISOString();
    db.collection('orders').doc(orderId).update({
      $set: {
        status: 'cancelled',
        statusText: STATUS_TEXT_MAP['cancelled'],
        updatedAt: now
      }
    });

    const updated = db.collection('orders').doc(orderId).get();
    return success(res, updated.data, '订单已取消');
  } catch (err) {
    return next(err);
  }
}

module.exports = { createOrder, getOrderList, getOrderDetail, payOrder, cancelOrder };
