const express = require('express');
const router = express.Router();

const sanitize = require('../middlewares/sanitizer');
const { validateToken } = require('../middlewares/validate-token');

const AuthController = require('../controllers/userController');

router.post('/signup', sanitize, AuthController.signup);

router.patch('/activate', sanitize, AuthController.activate);

router.post('/login', sanitize, AuthController.login);

router.patch('/forgot', sanitize, AuthController.forgotPassword);

router.patch('/reset', sanitize, AuthController.resetPassword);

router.get('/referred', validateToken, AuthController.referredAccounts);

router.get('/logout', validateToken, AuthController.logout);

module.exports = router;
