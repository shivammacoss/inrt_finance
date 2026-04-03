const express = require('express');
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth');
const { authLimiter, loginStrictLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post(
  '/register',
  loginStrictLimiter,
  authController.registerValidators,
  authController.register
);
router.post('/login', loginStrictLimiter, authController.loginValidators, authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/logout', authLimiter, authController.logout);
router.get('/me', authMiddleware(true), authController.me);
router.patch('/profile', authMiddleware(true), authController.profileValidators, authController.updateProfile);

module.exports = router;
