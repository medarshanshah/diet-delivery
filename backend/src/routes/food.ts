import express from 'express';
import {
  getFoodItems,
  getFoodItem,
  getPersonalizedRecommendations,
  getFoodCategories,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  searchFoodItems,
  getNutritionCompatibility
} from '../controllers/foodController';
import { protect, authorize, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { body, query } from 'express-validator';

const router = express.Router();

// Validation middleware
const createFoodItemValidation = [
  body('name').isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('description').isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category.id').notEmpty().withMessage('Category is required'),
  body('category.name').notEmpty().withMessage('Category name is required'),
  body('nutrition.calories').isFloat({ min: 0 }).withMessage('Calories must be a positive number'),
  body('nutrition.protein').isFloat({ min: 0 }).withMessage('Protein must be a positive number'),
  body('nutrition.carbohydrates').isFloat({ min: 0 }).withMessage('Carbohydrates must be a positive number'),
  body('nutrition.fats').isFloat({ min: 0 }).withMessage('Fats must be a positive number'),
  body('ingredients').isArray({ min: 1 }).withMessage('At least one ingredient is required'),
  body('preparationTime').isInt({ min: 1 }).withMessage('Preparation time must be at least 1 minute'),
  body('servingSize').notEmpty().withMessage('Serving size is required'),
  body('servingWeight').isFloat({ min: 0 }).withMessage('Serving weight must be a positive number')
];

const updateFoodItemValidation = [
  body('name').optional().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('description').optional().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('nutrition.calories').optional().isFloat({ min: 0 }).withMessage('Calories must be a positive number'),
  body('nutrition.protein').optional().isFloat({ min: 0 }).withMessage('Protein must be a positive number'),
  body('nutrition.carbohydrates').optional().isFloat({ min: 0 }).withMessage('Carbohydrates must be a positive number'),
  body('nutrition.fats').optional().isFloat({ min: 0 }).withMessage('Fats must be a positive number'),
  body('preparationTime').optional().isInt({ min: 1 }).withMessage('Preparation time must be at least 1 minute'),
  body('servingWeight').optional().isFloat({ min: 0 }).withMessage('Serving weight must be a positive number')
];

const searchValidation = [
  body('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  body('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  body('maxCalories').optional().isFloat({ min: 0 }).withMessage('Max calories must be a positive number'),
  body('minProtein').optional().isFloat({ min: 0 }).withMessage('Min protein must be a positive number'),
  body('maxCarbs').optional().isFloat({ min: 0 }).withMessage('Max carbs must be a positive number'),
  body('maxFats').optional().isFloat({ min: 0 }).withMessage('Max fats must be a positive number')
];

// Public routes
// @route   GET /api/food/items
// @desc    Get all food items with filters and pagination
// @access  Public
router.get('/items', getFoodItems);

// @route   GET /api/food/items/:id
// @desc    Get single food item
// @access  Public
router.get('/items/:id', getFoodItem);

// @route   GET /api/food/categories
// @desc    Get food categories
// @access  Public
router.get('/categories', getFoodCategories);

// @route   POST /api/food/search
// @desc    Search food items with nutrition filters
// @access  Public
router.post('/search', searchValidation, validate, searchFoodItems);

// Protected routes (authentication required)
// @route   GET /api/food/recommendations
// @desc    Get personalized food recommendations
// @access  Private
router.get('/recommendations', protect, getPersonalizedRecommendations);

// @route   GET /api/food/items/:id/compatibility
// @desc    Get nutrition compatibility for user
// @access  Private
router.get('/items/:id/compatibility', protect, getNutritionCompatibility);

// Vendor/Admin routes
// @route   POST /api/food/items
// @desc    Create food item
// @access  Private (Vendor/Admin)
router.post('/items', protect, authorize('vendor', 'admin'), createFoodItemValidation, validate, createFoodItem);

// @route   PUT /api/food/items/:id
// @desc    Update food item
// @access  Private (Vendor/Admin)
router.put('/items/:id', protect, authorize('vendor', 'admin'), updateFoodItemValidation, validate, updateFoodItem);

// @route   DELETE /api/food/items/:id
// @desc    Delete food item
// @access  Private (Vendor/Admin)
router.delete('/items/:id', protect, authorize('vendor', 'admin'), deleteFoodItem);

export default router;