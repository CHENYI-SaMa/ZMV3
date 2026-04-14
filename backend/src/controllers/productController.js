'use strict';

const { getDb } = require('../db');
const { success, failure, notFound } = require('../utils/response');

async function getGames(req, res, next) {
  try {
    const db = getDb();
    const result = db.collection('games').get();
    const games = result.data.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    return success(res, games);
  } catch (err) {
    return next(err);
  }
}

async function getCategories(req, res, next) {
  try {
    const db = getDb();
    const { game } = req.query;
    const query = game ? { game } : {};
    const result = db.collection('categories').where(query).get();
    const categories = result.data.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    return success(res, categories);
  } catch (err) {
    return next(err);
  }
}

async function getProductList(req, res, next) {
  try {
    const db = getDb();
    const { category, game, page = 1, pageSize = 10 } = req.query;

    const query = { status: 1 };
    if (category) query.category = category;
    if (game) query.game = game;

    const allResult = db.collection('products').where(query).get();
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

async function getProductDetail(req, res, next) {
  try {
    const db = getDb();
    const { productId } = req.params;

    // Try by _id first, then by numeric id
    let result = db.collection('products').doc(productId).get();
    if (!result.data) {
      const numericId = parseInt(productId, 10);
      if (!isNaN(numericId)) {
        result = db.collection('products').where({ id: numericId }).getOne();
      }
    }

    if (!result.data) {
      return notFound(res, '商品不存在');
    }

    return success(res, result.data);
  } catch (err) {
    return next(err);
  }
}

module.exports = { getGames, getCategories, getProductList, getProductDetail };
