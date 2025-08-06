import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { getRedisClient } from '../config/database';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Protect routes - require authentication
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      
      // Check if token is blacklisted (for logout functionality)
      const redisClient = getRedisClient();
      if (redisClient) {
        const isBlacklisted = await redisClient.get(`blacklist_${token}`);
        if (isBlacklisted) {
          return res.status(401).json({
            success: false,
            message: 'Token has been invalidated. Please login again.'
          });
        }
      }

      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Token may be invalid.'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated. Please contact support.'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.',
          code: 'INVALID_TOKEN'
        });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error. Please try again.'
    });
  }
};

// Authorize specific roles
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Silently fail for optional auth
        console.log('Optional auth failed:', error);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// Check if user is verified (email and phone)
export const requireVerification = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Account verification required. Please verify your email and phone number.',
      code: 'VERIFICATION_REQUIRED',
      verificationStatus: {
        emailVerified: req.user.emailVerified,
        phoneVerified: req.user.phoneVerified
      }
    });
  }

  next();
};

// Rate limit per user
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    const redisClient = getRedisClient();
    if (!redisClient) {
      return next();
    }

    const key = `rate_limit_${req.user.id}`;
    const current = await redisClient.get(key);
    
    if (current === null) {
      await redisClient.setex(key, Math.ceil(windowMs / 1000), '1');
      return next();
    }

    const count = parseInt(current);
    if (count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: await redisClient.ttl(key)
      });
    }

    await redisClient.incr(key);
    next();
  };
};

// Admin only middleware
export const adminOnly = authorize('admin');

// Vendor only middleware
export const vendorOnly = authorize('vendor', 'admin');

// Dietitian only middleware
export const dietitianOnly = authorize('dietitian', 'admin');

// Customer or admin middleware
export const customerOrAdmin = authorize('customer', 'admin');

// Self or admin middleware (user can access their own data or admin can access any)
export const selfOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const targetUserId = req.params.userId || req.params.id;
  
  if (req.user.role === 'admin' || req.user.id.toString() === targetUserId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. You can only access your own data.'
  });
};

// Blacklist token (for logout)
export const blacklistToken = async (token: string, expirationTime: number) => {
  const redisClient = getRedisClient();
  if (redisClient) {
    const ttl = expirationTime - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redisClient.setex(`blacklist_${token}`, ttl, 'true');
    }
  }
};

export default {
  protect,
  authorize,
  optionalAuth,
  requireVerification,
  userRateLimit,
  adminOnly,
  vendorOnly,
  dietitianOnly,
  customerOrAdmin,
  selfOrAdmin,
  blacklistToken
};