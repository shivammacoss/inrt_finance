const express = require('express');
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/register', authController.registerValidators, authController.register);
router.post('/login', authController.loginValidators, authController.login);
router.get('/me', authMiddleware(true), authController.me);
router.patch('/profile', authMiddleware(true), authController.profileValidators, authController.updateProfile);

module.exports = router;
