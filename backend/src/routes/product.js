'use strict';

const router = require('express').Router();
const { getGames, getCategories, getProductList, getProductDetail } = require('../controllers/productController');

router.get('/games', getGames);
router.get('/categories', getCategories);
router.get('/list', getProductList);
router.get('/:productId', getProductDetail);

module.exports = router;
