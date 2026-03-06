const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order'); // You'll need this model

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create a new order
// @route   POST /api/orders/create-order
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        userId: req.user.id, // From auth middleware
        email: req.user.email
      }
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Error creating order:', error);
    next(error);
  }
};

// @desc    Verify payment signature
// @route   POST /api/orders/verify-payment
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // Generate expected signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // Verify signature
    if (expectedSignature === razorpay_signature) {
      // Payment is verified - save to database
      const order = await Order.create({
        user: req.user.id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        amount: req.body.amount,
        products: req.body.products,
        status: 'completed'
      });

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        order
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    next(error);
  }
};

// @desc    Create a payment link (optional - for invoices)
// @route   POST /api/orders/create-payment-link
// @access  Private
exports.createPaymentLink = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', description, customer } = req.body;

    const paymentLink = await razorpay.paymentLink.create({
      amount: amount * 100,
      currency,
      accept_partial: false,
      description,
      customer: {
        name: customer.name,
        email: customer.email,
        contact: customer.contact
      },
      notify: {
        sms: true,
        email: true
      },
      reminder_enable: true,
      notes: {
        userId: req.user.id
      }
    });

    res.status(200).json({
      success: true,
      paymentLink: paymentLink.short_url,
      id: paymentLink.id
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    next(error);
  }
};