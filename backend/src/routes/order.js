'use strict';

const router = require('express').Router();
const { createOrder, getOrderList, getOrderDetail, payOrder, cancelOrder } = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/create', createOrder);
router.get('/list', getOrderList);
router.get('/:orderId', getOrderDetail);
router.post('/:orderId/pay', payOrder);
router.post('/:orderId/cancel', cancelOrder);

module.exports = router;
