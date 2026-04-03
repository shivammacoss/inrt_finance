const express = require('express');
const walletController = require('../controllers/wallet.controller');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware(true));

router.get('/balance', walletController.balance);
router.get('/deposit-info', walletController.depositInfo);
router.post('/transfer', walletController.transferValidators, walletController.transfer);
router.post('/deposit', walletController.depositValidators, walletController.deposit);
router.post('/withdraw', walletController.withdrawValidators, walletController.withdraw);
router.post(
  '/deposit-request',
  walletController.depositRequestValidators,
  walletController.depositRequest
);
router.post(
  '/withdraw-request',
  walletController.withdrawRequestValidators,
  walletController.withdrawRequest
);
router.get('/requests', walletController.listRequests);
router.get('/transactions', walletController.transactions);

module.exports = router;
