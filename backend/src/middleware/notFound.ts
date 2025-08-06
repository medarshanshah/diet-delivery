import { Request, Response, NextFunction } from 'express';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /health - Health check',
      'POST /api/auth/register - User registration',
      'POST /api/auth/login - User login',
      'GET /api/users/profile - Get user profile',
      'GET /api/food/items - Get food items',
      'POST /api/orders - Create order',
      'GET /api/vendors - Get vendors',
      'GET /api/dietitians - Get dietitians'
    ]
  });
};