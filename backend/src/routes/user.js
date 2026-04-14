'use strict';

const router = require('express').Router();
const { getProfile, updateProfile, setPaymentPassword, realNameAuth } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/payment-password', setPaymentPassword);
router.post('/real-name', realNameAuth);

module.exports = router;
