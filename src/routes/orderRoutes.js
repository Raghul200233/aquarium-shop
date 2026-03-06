const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  createPaymentLink
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// All routes are protected (user must be logged in)
router.post('/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);
router.post('/create-payment-link', protect, createPaymentLink);

module.exports = router;