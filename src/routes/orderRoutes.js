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

// Also add a route to get user orders
router.get('/', protect, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const orders = await Order.find({ user: req.user.id })
      .sort('-createdAt')
      .populate('products.product', 'name price images');
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single order by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('products.product', 'name price images');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;