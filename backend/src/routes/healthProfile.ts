import express from 'express';
import {
  getHealthProfile,
  createHealthProfile,
  updateHealthProfile,
  updateDietaryRestrictions,
  updateAllergies,
  updateHealthGoals,
  updateMedicalConditions,
  updateBasicInfo,
  addWeightEntry,
  getWeightHistory,
  getNutritionRecommendations,
  deleteHealthProfile
} from '../controllers/healthProfileController';
import {
  createHealthProfileValidation,
  updateBasicInfoValidation,
  updateDietaryRestrictionsValidation,
  updateAllergiesValidation,
  updateHealthGoalsValidation,
  updateMedicalConditionsValidation,
  addWeightEntryValidation,
  getWeightHistoryValidation
} from '../middleware/healthProfileValidation';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = express.Router();

// All routes are protected - user must be authenticated
router.use(protect);

// @route   GET /api/health-profile
// @desc    Get current user's health profile
// @access  Private
router.get('/', getHealthProfile);

// @route   POST /api/health-profile
// @desc    Create user's health profile
// @access  Private
router.post('/', createHealthProfileValidation, validate, createHealthProfile);

// @route   PUT /api/health-profile
// @desc    Update user's complete health profile
// @access  Private
router.put('/', createHealthProfileValidation, validate, updateHealthProfile);

// @route   PUT /api/health-profile/basic-info
// @desc    Update basic information (age, gender, height, weight, activity level)
// @access  Private
router.put('/basic-info', updateBasicInfoValidation, validate, updateBasicInfo);

// @route   PUT /api/health-profile/dietary-restrictions
// @desc    Update dietary restrictions
// @access  Private
router.put('/dietary-restrictions', updateDietaryRestrictionsValidation, validate, updateDietaryRestrictions);

// @route   PUT /api/health-profile/allergies
// @desc    Update allergies
// @access  Private
router.put('/allergies', updateAllergiesValidation, validate, updateAllergies);

// @route   PUT /api/health-profile/goals
// @desc    Update health goals
// @access  Private
router.put('/goals', updateHealthGoalsValidation, validate, updateHealthGoals);

// @route   PUT /api/health-profile/medical-conditions
// @desc    Update medical conditions
// @access  Private
router.put('/medical-conditions', updateMedicalConditionsValidation, validate, updateMedicalConditions);

// @route   POST /api/health-profile/weight-history
// @desc    Add weight entry to weight history
// @access  Private
router.post('/weight-history', addWeightEntryValidation, validate, addWeightEntry);

// @route   GET /api/health-profile/weight-history
// @desc    Get weight history
// @access  Private
router.get('/weight-history', getWeightHistoryValidation, validate, getWeightHistory);

// @route   GET /api/health-profile/nutrition-recommendations
// @desc    Get personalized nutrition recommendations
// @access  Private
router.get('/nutrition-recommendations', getNutritionRecommendations);

// @route   DELETE /api/health-profile
// @desc    Delete user's health profile
// @access  Private
router.delete('/', deleteHealthProfile);

export default router;