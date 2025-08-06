import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { protect } from '../middleware/auth';
import authController from '../controllers/authController';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('phone')
    .matches(/^(\+977|977|0)?[0-9]{10}$/)
    .withMessage('Please provide a valid Nepali phone number'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['customer', 'dietitian', 'vendor'])
    .withMessage('Invalid role specified')
];

const loginValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or phone number is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const verifyEmailValidation = [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Valid 6-digit OTP is required')
];

const verifyPhoneValidation = [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Valid 6-digit OTP is required')
];

const resendOTPValidation = [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  
  body('type')
    .isIn(['email', 'phone'])
    .withMessage('Type must be either email or phone')
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

// Routes

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', registerValidation, validate, authController.register);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', loginValidation, validate, authController.login);

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
router.post('/verify-email', verifyEmailValidation, validate, authController.verifyEmail);

// @desc    Verify phone with OTP
// @route   POST /api/auth/verify-phone
// @access  Public
router.post('/verify-phone', verifyPhoneValidation, validate, authController.verifyPhone);

// @desc    Resend verification OTP
// @route   POST /api/auth/resend-otp
// @access  Public
router.post('/resend-otp', resendOTPValidation, validate, authController.resendOTP);

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', refreshTokenValidation, validate, authController.refreshToken);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, authController.logout);

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, authController.getMe);

export default router;