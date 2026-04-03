const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authMiddleware } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

const router = express.Router();

router.use(authMiddleware(true), adminOnly);

router.get('/stats', adminController.stats);
router.get('/users', adminController.users);
router.get('/transactions', adminController.transactions);
router.get('/actions', adminController.actions);
router.post('/mint', adminController.mintValidators, adminController.mint);
router.post('/burn', adminController.burnValidators, adminController.burn);
router.post('/adjust', adminController.adjustValidators, adminController.adjust);
router.post('/adjust-balance', adminController.adjustValidators, adminController.adjust);
router.get('/requests', adminController.listRequests);
router.post('/request/approve', adminController.requestIdValidators, adminController.approveRequest);
router.post('/request/reject', adminController.rejectRequestValidators, adminController.rejectRequest);

module.exports = router;
