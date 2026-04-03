const express = require('express');
const userController = require('../controllers/user.controller');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware(true));
router.put('/profile', userController.putProfileValidators, userController.putProfile);

module.exports = router;
