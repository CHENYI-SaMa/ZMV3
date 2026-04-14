'use strict';

const { getDb } = require('../db');
const { hashPassword, comparePassword } = require('../utils/crypto');
const { signAdminToken } = require('../utils/jwt');
const { success, failure, notFound } = require('../utils/response');

const DEFAULT_ADMIN = {
  _id: 'admin_001',
  username: 'admin',
  passwordHash: null, // set on first request if not in DB
  role: 'admin',
  createdAt: new Date().toISOString()
};

async function ensureDefaultAdmin(db) {
  const result = db.collection('admins').where({ username: 'admin' }).getOne();
  if (!result.data) {
    const passwordHash = await hashPassword('admin123456');
    db.collection('admins').add({ ...DEFAULT_ADMIN, passwordHash });
  }
}

async function adminLogin(req, res, next) {
  try {
    const db = getDb();
    const { username, password } = req.body;

    if (!username || !password) {
      return failure(res, '请输入用户名和密码');
    }

    await ensureDefaultAdmin(db);

    const result = db.collection('admins').where({ username }).getOne();
    if (!result.data) {
      return failure(res, '用户名或密码错误');
    }

    const admin = result.data;
    const valid = await comparePassword(password, admin.passwordHash);
    if (!valid) {
      return failure(res, '用户名或密码错误');
    }

    const token = signAdminToken({ id: admin._id, username: admin.username });
    const { passwordHash: _, ...safeAdmin } = admin;

    return success(res, { token, admin: safeAdmin }, '登录成功');
  } catch (err) {
    return next(err);
  }
}

async function getDashboard(req, res, next) {
  try {
    const db = getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const allOrders = db.collection('orders').get().data;
    const allUsers = db.collection('users').get().data;
    const allProducts = db.collection('products').get().data;

    const todayOrders = allOrders.filter((o) => o.createdAt >= todayStr);
    const todayRevenue = todayOrders
      .filter((o) => ['paid', 'processing', 'completed'].includes(o.status))
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const totalRevenue = allOrders
      .filter((o) => ['paid', 'processing', 'completed'].includes(o.status))
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return success(res, {
      todayOrders: todayOrders.length,
      todayRevenue,
      totalOrders: allOrders.length,
      totalRevenue,
      totalUsers: allUsers.length,
      totalProducts: allProducts.length,
      pendingOrders: allOrders.filter((o) => o.status === 'pending').length,
      processingOrders: allOrders.filter((o) => o.status === 'processing').length
    });
  } catch (err) {
    return next(err);
  }
}

// ---- Orders ----

async function getAdminOrders(req, res, next) {
  try {
    const db = getDb();
    const { status, page = 1, pageSize = 20 } = req.query;

    const query = {};
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

async function updateOrderStatus(req, res, next) {
  try {
    const db = getDb();
    const { orderId } = req.params;
    const { status } = req.body;

    const STATUS_TEXT_MAP = {
      pending: '待支付', paying: '支付中', paid: '已支付',
      failed: '支付失败', processing: '处理中', completed: '已完成',
      cancelled: '已取消', refunded: '已退款'
    };

    if (!status || !STATUS_TEXT_MAP[status]) {
      return failure(res, '无效的订单状态');
    }

    const result = db.collection('orders').doc(orderId).get();
    if (!result.data) {
      return notFound(res, '订单不存在');
    }

    db.collection('orders').doc(orderId).update({
      $set: { status, statusText: STATUS_TEXT_MAP[status], updatedAt: new Date().toISOString() }
    });

    const updated = db.collection('orders').doc(orderId).get();
    return success(res, updated.data, '订单状态已更新');
  } catch (err) {
    return next(err);
  }
}

async function deleteOrder(req, res, next) {
  try {
    const db = getDb();
    const { orderId } = req.params;

    const result = db.collection('orders').doc(orderId).get();
    if (!result.data) {
      return notFound(res, '订单不存在');
    }

    db.collection('orders').doc(orderId).update({
      $set: { status: 'cancelled', statusText: '已取消', updatedAt: new Date().toISOString() }
    });

    return success(res, null, '订单已取消');
  } catch (err) {
    return next(err);
  }
}

// ---- Products ----

async function getAdminProducts(req, res, next) {
  try {
    const db = getDb();
    const { page = 1, pageSize = 20 } = req.query;

    const allResult = db.collection('products').get();
    const total = allResult.data.length;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const skip = (pageNum - 1) * pageSizeNum;

    const items = allResult.data
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .slice(skip, skip + pageSizeNum);

    return success(res, { total, page: pageNum, pageSize: pageSizeNum, items });
  } catch (err) {
    return next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const db = getDb();
    const { name, game, gameName, category, price, cost, priceUnit, stock, sort, desc, detail, image, status } = req.body;

    if (!name || !game || !category || price == null) {
      return failure(res, '商品名称、游戏、分类、价格为必填项');
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return failure(res, '价格格式不正确');
    }

    const now = new Date().toISOString();
    const allProducts = db.collection('products').get().data;
    const maxId = allProducts.reduce((max, p) => Math.max(max, p.id || 0), 10000);

    const product = {
      id: maxId + 1,
      name,
      game,
      gameName: gameName || '',
      category,
      price: parseFloat(price),
      cost: parseFloat(cost || 0),
      profit: parseFloat(price) - parseFloat(cost || 0),
      priceUnit: priceUnit || '单',
      stock: parseInt(stock || 0, 10),
      sales: 0,
      sort: parseInt(sort || 0, 10),
      desc: desc || '',
      detail: detail || '',
      image: image || '',
      status: status !== undefined ? parseInt(status, 10) : 1,
      createdAt: now
    };

    const { id: newId } = db.collection('products').add(product);
    const created = db.collection('products').doc(newId).get();
    return success(res, created.data, '商品创建成功');
  } catch (err) {
    return next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const db = getDb();
    const { productId } = req.params;

    const result = db.collection('products').doc(productId).get();
    if (!result.data) {
      return notFound(res, '商品不存在');
    }

    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    if (updates.price !== undefined) updates.price = parseFloat(updates.price);
    if (updates.cost !== undefined) {
      updates.cost = parseFloat(updates.cost);
      updates.profit = (updates.price || result.data.price) - updates.cost;
    }
    if (updates.stock !== undefined) updates.stock = parseInt(updates.stock, 10);
    if (updates.sort !== undefined) updates.sort = parseInt(updates.sort, 10);

    db.collection('products').doc(productId).update({ $set: updates });
    const updated = db.collection('products').doc(productId).get();
    return success(res, updated.data, '商品已更新');
  } catch (err) {
    return next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const db = getDb();
    const { productId } = req.params;

    const result = db.collection('products').doc(productId).get();
    if (!result.data) {
      return notFound(res, '商品不存在');
    }

    db.collection('products').doc(productId).update({
      $set: { status: 0, updatedAt: new Date().toISOString() }
    });

    return success(res, null, '商品已删除（下架）');
  } catch (err) {
    return next(err);
  }
}

// ---- Categories ----

async function getAdminCategories(req, res, next) {
  try {
    const db = getDb();
    const result = db.collection('categories').get();
    return success(res, result.data);
  } catch (err) {
    return next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const db = getDb();
    const { game, name, icon, sort } = req.body;

    if (!game || !name) {
      return failure(res, '游戏和分类名称为必填项');
    }

    const category = {
      game,
      name,
      icon: icon || '',
      sort: parseInt(sort || 0, 10),
      createdAt: new Date().toISOString()
    };

    const { id } = db.collection('categories').add(category);
    const created = db.collection('categories').doc(id).get();
    return success(res, created.data, '分类创建成功');
  } catch (err) {
    return next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const db = getDb();
    const { categoryId } = req.params;

    const result = db.collection('categories').doc(categoryId).get();
    if (!result.data) {
      return notFound(res, '分类不存在');
    }

    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    db.collection('categories').doc(categoryId).update({ $set: updates });
    const updated = db.collection('categories').doc(categoryId).get();
    return success(res, updated.data, '分类已更新');
  } catch (err) {
    return next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const db = getDb();
    const { categoryId } = req.params;

    const result = db.collection('categories').doc(categoryId).get();
    if (!result.data) {
      return notFound(res, '分类不存在');
    }

    db.collection('categories').doc(categoryId).remove();
    return success(res, null, '分类已删除');
  } catch (err) {
    return next(err);
  }
}

// ---- Boosters ----

async function getAdminBoosters(req, res, next) {
  try {
    const db = getDb();
    const { page = 1, pageSize = 20 } = req.query;

    const allResult = db.collection('boosters').get();
    const total = allResult.data.length;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const skip = (pageNum - 1) * pageSizeNum;
    const items = allResult.data.slice(skip, skip + pageSizeNum);

    return success(res, { total, page: pageNum, pageSize: pageSizeNum, items });
  } catch (err) {
    return next(err);
  }
}

async function createBooster(req, res, next) {
  try {
    const db = getDb();
    const { name, phone, level, games, bio } = req.body;

    if (!name || !phone) {
      return failure(res, '打手姓名和手机号为必填项');
    }

    const booster = {
      name,
      phone,
      level: parseInt(level || 1, 10),
      status: 'online',
      games: games || [],
      rating: 5.0,
      orders: 0,
      completed: 0,
      income: 0,
      bio: bio || '',
      createdAt: new Date().toISOString()
    };

    const { id } = db.collection('boosters').add(booster);
    const created = db.collection('boosters').doc(id).get();
    return success(res, created.data, '打手创建成功');
  } catch (err) {
    return next(err);
  }
}

async function updateBooster(req, res, next) {
  try {
    const db = getDb();
    const { boosterId } = req.params;

    const result = db.collection('boosters').doc(boosterId).get();
    if (!result.data) {
      return notFound(res, '打手不存在');
    }

    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    db.collection('boosters').doc(boosterId).update({ $set: updates });
    const updated = db.collection('boosters').doc(boosterId).get();
    return success(res, updated.data, '打手信息已更新');
  } catch (err) {
    return next(err);
  }
}

async function deleteBooster(req, res, next) {
  try {
    const db = getDb();
    const { boosterId } = req.params;

    const result = db.collection('boosters').doc(boosterId).get();
    if (!result.data) {
      return notFound(res, '打手不存在');
    }

    db.collection('boosters').doc(boosterId).remove();
    return success(res, null, '打手已删除');
  } catch (err) {
    return next(err);
  }
}

// ---- Users ----

async function getAdminUsers(req, res, next) {
  try {
    const db = getDb();
    const { page = 1, pageSize = 20 } = req.query;

    const allResult = db.collection('users').get();
    const total = allResult.data.length;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const skip = (pageNum - 1) * pageSizeNum;

    const items = allResult.data
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + pageSizeNum)
      .map(({ passwordHash: _, paymentPasswordHash: __, ...u }) => u);

    return success(res, { total, page: pageNum, pageSize: pageSizeNum, items });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  adminLogin,
  getDashboard,
  getAdminOrders, updateOrderStatus, deleteOrder,
  getAdminProducts, createProduct, updateProduct, deleteProduct,
  getAdminCategories, createCategory, updateCategory, deleteCategory,
  getAdminBoosters, createBooster, updateBooster, deleteBooster,
  getAdminUsers
};
