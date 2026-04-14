'use strict';

const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/user', require('./user'));
router.use('/product', require('./product'));
router.use('/order', require('./order'));
router.use('/wallet', require('./wallet'));
router.use('/admin', require('./admin'));

module.exports = router;
