import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

interface ErrorResponse {
  success: boolean;
  message: string;
  error?: any;
  stack?: string;
}

class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = 'Duplicate field value entered';
    
    // Extract field name for better error message
    const field = Object.keys(err.keyValue)[0];
    if (field === 'email') {
      message = 'Email address already exists';
    } else if (field === 'phone') {
      message = 'Phone number already exists';
    } else if (field === 'orderNumber') {
      message = 'Order number already exists';
    }
    
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired. Please log in again';
    error = new AppError(message, 401);
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large';
    error = new AppError(message, 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = new AppError(message, 400);
  }

  // Payment errors
  if (err.type === 'StripeCardError') {
    const message = err.message || 'Payment failed';
    error = new AppError(message, 402);
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests. Please try again later';
    error = new AppError(message, 429);
  }

  // Database connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
    const message = 'Database connection error. Please try again later';
    error = new AppError(message, 503);
  }

  const response: ErrorResponse = {
    success: false,
    message: error.message || 'Server Error',
  };

  // Include error details in development
  if (process.env.NODE_ENV === 'development') {
    response.error = error;
    response.stack = err.stack;
  }

  // Send appropriate status code
  const statusCode = error.statusCode || 500;
  
  res.status(statusCode).json(response);
};

// Handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export { errorHandler, AppError, asyncHandler };