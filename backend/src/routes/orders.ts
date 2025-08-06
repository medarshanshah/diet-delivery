import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  reviewOrder,
  getOrderNutrition,
  repeatOrder,
  getUserOrderStats
} from '../controllers/orderController';
import {
  createSubscription,
  getUserSubscriptions,
  getSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  modifySubscriptionItems,
  getSubscriptionMeals,
  getSubscriptionAnalytics
} from '../controllers/subscriptionController';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { body, query } from 'express-validator';

const router = express.Router();

// Validation middleware
const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.foodItemId').isMongoId().withMessage('Valid food item ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('orderType').optional().isIn(['single', 'subscription', 'hospital_package']).withMessage('Invalid order type'),
  body('deliveryAddress.street').notEmpty().withMessage('Street address is required'),
  body('deliveryAddress.city').notEmpty().withMessage('City is required'),
  body('deliveryTime').optional().isISO8601().withMessage('Valid delivery time is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required')
];

const subscriptionValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.foodItemId').isMongoId().withMessage('Valid food item ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('subscriptionType').isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid subscription type'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 day'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('deliveryAddress.street').notEmpty().withMessage('Street address is required'),
  body('deliveryAddress.city').notEmpty().withMessage('City is required'),
  body('mealsPerDay').optional().isInt({ min: 1, max: 5 }).withMessage('Meals per day must be between 1 and 5'),
  body('familyMembers').optional().isInt({ min: 1, max: 10 }).withMessage('Family members must be between 1 and 10')
];

const reviewValidation = [
  body('foodRating').isFloat({ min: 1, max: 5 }).withMessage('Food rating must be between 1 and 5'),
  body('deliveryRating').isFloat({ min: 1, max: 5 }).withMessage('Delivery rating must be between 1 and 5'),
  body('overallRating').isFloat({ min: 1, max: 5 }).withMessage('Overall rating must be between 1 and 5'),
  body('review').optional().isString().isLength({ max: 500 }).withMessage('Review cannot exceed 500 characters')
];

const updateStatusValidation = [
  body('status').isIn(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('notes').optional().isString().isLength({ max: 200 }).withMessage('Notes cannot exceed 200 characters')
];

// ========== ORDER ROUTES ==========

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, createOrderValidation, validate, createOrder);

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', protect, getUserOrders);

// @route   GET /api/orders/stats
// @desc    Get order statistics for user
// @access  Private
router.get('/stats', protect, getUserOrderStats);

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, getOrder);

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin/Vendor only)
// @access  Private (Admin/Vendor)
router.put('/:id/status', protect, authorize('admin', 'vendor'), updateStatusValidation, validate, updateOrderStatus);

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.put('/:id/cancel', protect, cancelOrder);

// @route   POST /api/orders/:id/review
// @desc    Rate and review order
// @access  Private
router.post('/:id/review', protect, reviewValidation, validate, reviewOrder);

// @route   GET /api/orders/:id/nutrition
// @desc    Get order nutrition summary
// @access  Private
router.get('/:id/nutrition', protect, getOrderNutrition);

// @route   POST /api/orders/repeat/:id
// @desc    Repeat last order
// @access  Private
router.post('/repeat/:id', protect, repeatOrder);

// ========== SUBSCRIPTION ROUTES ==========

// @route   POST /api/orders/subscriptions
// @desc    Create subscription plan
// @access  Private
router.post('/subscriptions', protect, subscriptionValidation, validate, createSubscription);

// @route   GET /api/orders/subscriptions
// @desc    Get user's subscriptions
// @access  Private
router.get('/subscriptions', protect, getUserSubscriptions);

// @route   GET /api/orders/subscriptions/:id
// @desc    Get single subscription
// @access  Private
router.get('/subscriptions/:id', protect, getSubscription);

// @route   PUT /api/orders/subscriptions/:id/pause
// @desc    Pause subscription
// @access  Private
router.put('/subscriptions/:id/pause', protect, pauseSubscription);

// @route   PUT /api/orders/subscriptions/:id/resume
// @desc    Resume subscription
// @access  Private
router.put('/subscriptions/:id/resume', protect, resumeSubscription);

// @route   DELETE /api/orders/subscriptions/:id
// @desc    Cancel subscription
// @access  Private
router.delete('/subscriptions/:id', protect, cancelSubscription);

// @route   PUT /api/orders/subscriptions/:id/items
// @desc    Modify subscription items
// @access  Private
router.put('/subscriptions/:id/items', protect, modifySubscriptionItems);

// @route   GET /api/orders/subscriptions/:id/meals
// @desc    Get subscription meal history
// @access  Private
router.get('/subscriptions/:id/meals', protect, getSubscriptionMeals);

// @route   GET /api/orders/subscriptions/:id/analytics
// @desc    Get subscription analytics
// @access  Private
router.get('/subscriptions/:id/analytics', protect, getSubscriptionAnalytics);

export default router;