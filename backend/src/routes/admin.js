'use strict';

const router = require('express').Router();
const {
  adminLogin,
  getDashboard,
  getAdminOrders, updateOrderStatus, deleteOrder,
  getAdminProducts, createProduct, updateProduct, deleteProduct,
  getAdminCategories, createCategory, updateCategory, deleteCategory,
  getAdminBoosters, createBooster, updateBooster, deleteBooster,
  getAdminUsers
} = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');

router.post('/login', adminLogin);

// All routes below require admin auth
router.use(authenticateAdmin);

router.get('/dashboard', getDashboard);

// Orders
router.get('/orders', getAdminOrders);
router.put('/orders/:orderId/status', updateOrderStatus);
router.delete('/orders/:orderId', deleteOrder);

// Products
router.get('/products', getAdminProducts);
router.post('/products', createProduct);
router.put('/products/:productId', updateProduct);
router.delete('/products/:productId', deleteProduct);

// Categories
router.get('/categories', getAdminCategories);
router.post('/categories', createCategory);
router.put('/categories/:categoryId', updateCategory);
router.delete('/categories/:categoryId', deleteCategory);

// Boosters
router.get('/boosters', getAdminBoosters);
router.post('/boosters', createBooster);
router.put('/boosters/:boosterId', updateBooster);
router.delete('/boosters/:boosterId', deleteBooster);

// Users
router.get('/users', getAdminUsers);

module.exports = router;
