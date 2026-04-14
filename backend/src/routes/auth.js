'use strict';

const router = require('express').Router();
const { register, login, logout, sendSms, resetPassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.post('/send-sms', sendSms);
router.post('/reset-password', resetPassword);

module.exports = router;
