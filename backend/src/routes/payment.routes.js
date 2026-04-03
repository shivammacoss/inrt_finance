const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/create-order',
  authMiddleware(true),
  paymentController.createOrderValidators,
  paymentController.createOrder
);
router.post('/verify', authMiddleware(true), paymentController.verifyValidators, paymentController.verify);

module.exports = router;
