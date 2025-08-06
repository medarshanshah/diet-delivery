import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User, { IUser } from '../models/User';
import HealthProfile from '../models/HealthProfile';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { blacklistToken } from '../middleware/auth';
import { sendEmail } from '../services/emailService';
import { sendSMS } from '../services/smsService';
import { getRedisClient } from '../config/database';

// Generate OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate and send OTP
const sendOTP = async (phone: string, otp: string) => {
  const message = `Your HealthyBites verification code is: ${otp}. Valid for 10 minutes.`;
  await sendSMS(phone, message);
};

// Send verification email
const sendVerificationEmail = async (email: string, name: string, otp: string) => {
  const subject = 'Verify Your HealthyBites Account';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">Welcome to HealthyBites!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for joining HealthyBites. Please verify your email address to complete your registration.</p>
      <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; text-align: center;">
        <h3 style="margin: 0; color: #333;">Your verification code:</h3>
        <h1 style="color: #4CAF50; font-size: 32px; margin: 10px 0;">${otp}</h1>
        <p style="color: #666; margin: 0;">This code will expire in 10 minutes.</p>
      </div>
      <p>If you didn't create this account, please ignore this email.</p>
      <p>Best regards,<br>The HealthyBites Team</p>
    </div>
  `;
  
  await sendEmail(email, subject, html);
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, phone, password, role = 'customer' } = req.body;

  // Validation
  if (!name || !email || !phone || !password) {
    return next(new AppError('Please provide all required fields', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return next(new AppError('Email already registered', 400));
    }
    if (existingUser.phone === phone) {
      return next(new AppError('Phone number already registered', 400));
    }
  }

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role
  });

  // Generate OTP for verification
  const emailOTP = generateOTP();
  const phoneOTP = generateOTP();
  
  // Store OTPs in user document
  user.otpCode = emailOTP; // We'll use email OTP as primary
  user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  // Store phone OTP in Redis temporarily
  const redisClient = getRedisClient();
  if (redisClient) {
    await redisClient.setex(`phone_otp_${user.id}`, 600, phoneOTP); // 10 minutes
  }

  try {
    // Send verification email and SMS
    await Promise.all([
      sendVerificationEmail(email, name, emailOTP),
      sendOTP(phone, phoneOTP)
    ]);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email and phone number.',
      data: {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        verificationRequired: true
      }
    });
  } catch (error) {
    // If email/SMS sending fails, still create user but inform about the issue
    console.error('Failed to send verification:', error);
    res.status(201).json({
      success: true,
      message: 'User registered successfully, but verification messages could not be sent. Please try to resend verification.',
      data: {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        verificationRequired: true
      }
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { identifier, password } = req.body; // identifier can be email or phone

  // Validation
  if (!identifier || !password) {
    return next(new AppError('Please provide email/phone and password', 400));
  }

  // Find user by email or phone
  const user = await User.findOne({
    $or: [
      { email: identifier },
      { phone: identifier }
    ],
    isActive: true
  }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid credentials', 401));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  // Add refresh token to user's refresh tokens array
  user.refreshTokens.push(refreshToken);
  await user.save();

  // Get user's health profile if exists
  const healthProfile = await HealthProfile.findOne({ userId: user.id });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        settings: user.settings
      },
      hasHealthProfile: !!healthProfile,
      tokens: {
        accessToken: token,
        refreshToken: refreshToken,
        type: 'Bearer',
        expiresIn: process.env.JWT_EXPIRE
      }
    }
  });
});

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return next(new AppError('Please provide user ID and OTP', 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.emailVerified) {
    return next(new AppError('Email already verified', 400));
  }

  if (!user.otpCode || !user.otpExpire || user.otpExpire < new Date()) {
    return next(new AppError('OTP expired or invalid. Please request a new one.', 400));
  }

  if (user.otpCode !== otp) {
    return next(new AppError('Invalid OTP', 400));
  }

  // Mark email as verified
  user.emailVerified = true;
  user.otpCode = undefined;
  user.otpExpire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    data: {
      emailVerified: true,
      isFullyVerified: user.isVerified
    }
  });
});

// @desc    Verify phone with OTP
// @route   POST /api/auth/verify-phone
// @access  Public
export const verifyPhone = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return next(new AppError('Please provide user ID and OTP', 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.phoneVerified) {
    return next(new AppError('Phone already verified', 400));
  }

  // Check OTP from Redis
  const redisClient = getRedisClient();
  if (!redisClient) {
    return next(new AppError('Verification service unavailable', 503));
  }

  const storedOTP = await redisClient.get(`phone_otp_${userId}`);
  if (!storedOTP || storedOTP !== otp) {
    return next(new AppError('Invalid or expired OTP', 400));
  }

  // Mark phone as verified
  user.phoneVerified = true;
  await user.save();

  // Remove OTP from Redis
  await redisClient.del(`phone_otp_${userId}`);

  res.status(200).json({
    success: true,
    message: 'Phone verified successfully',
    data: {
      phoneVerified: true,
      isFullyVerified: user.isVerified
    }
  });
});

// @desc    Resend verification OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, type } = req.body; // type: 'email' or 'phone'

  if (!userId || !type) {
    return next(new AppError('Please provide user ID and verification type', 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const otp = generateOTP();

  if (type === 'email') {
    if (user.emailVerified) {
      return next(new AppError('Email already verified', 400));
    }

    user.otpCode = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user.email, user.name, otp);
  } else if (type === 'phone') {
    if (user.phoneVerified) {
      return next(new AppError('Phone already verified', 400));
    }

    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.setex(`phone_otp_${userId}`, 600, otp);
    }

    await sendOTP(user.phone, otp);
  } else {
    return next(new AppError('Invalid verification type', 400));
  }

  res.status(200).json({
    success: true,
    message: `${type} verification OTP sent successfully`
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    // Blacklist the current token
    const decoded = require('jsonwebtoken').decode(token) as any;
    if (decoded?.exp) {
      await blacklistToken(token, decoded.exp);
    }
  }

  // Remove refresh token from user's refresh tokens array
  if (req.user) {
    const user = await User.findById(req.user.id);
    if (user && req.body.refreshToken) {
      user.refreshTokens = user.refreshTokens.filter(
        rt => rt !== req.body.refreshToken
      );
      await user.save();
    }
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token required', 400));
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return next(new AppError('Invalid refresh token', 401));
    }

    // Generate new access token
    const newAccessToken = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        type: 'Bearer',
        expiresIn: process.env.JWT_EXPIRE
      }
    });
  } catch (error) {
    return next(new AppError('Invalid refresh token', 401));
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const healthProfile = await HealthProfile.findOne({ userId: user.id });

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        settings: user.settings,
        createdAt: user.createdAt
      },
      hasHealthProfile: !!healthProfile
    }
  });
});

export default {
  register,
  login,
  verifyEmail,
  verifyPhone,
  resendOTP,
  logout,
  refreshToken,
  getMe
};