'use strict';

const router = require('express').Router();
const { getWallet, recharge } = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getWallet);
router.post('/recharge', recharge);

module.exports = router;
