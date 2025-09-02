const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

// Signup route
router.post('/signup', authController.signup);

// Email verification route
router.post('/verify-email', authController.verifyEmail);

// Forgot password route
router.post('/forgot-password', authController.forgotPassword);

// Reset password route
router.post('/reset-password', authController.resetPassword);

//resend verification route
router.post('/resend-verification', authController.resendVerificationEmail);

// Login route
router.post('/login', authController.login);

module.exports = router;
