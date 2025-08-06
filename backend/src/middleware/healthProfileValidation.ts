import { body, query } from 'express-validator';

export const createHealthProfileValidation = [
  body('age')
    .isInt({ min: 13, max: 120 })
    .withMessage('Age must be between 13 and 120'),
  
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  
  body('height')
    .isFloat({ min: 50, max: 250 })
    .withMessage('Height must be between 50 and 250 cm'),
  
  body('weight')
    .isFloat({ min: 20, max: 300 })
    .withMessage('Weight must be between 20 and 300 kg'),
  
  body('activityLevel')
    .isIn(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'])
    .withMessage('Invalid activity level'),
  
  body('healthGoals')
    .isArray({ min: 1 })
    .withMessage('At least one health goal is required'),
  
  body('healthGoals.*.goal')
    .isIn(['weight_loss', 'weight_gain', 'muscle_gain', 'maintain_weight', 'improve_health', 'manage_diabetes', 'manage_hypertension', 'heart_health', 'digestive_health'])
    .withMessage('Invalid health goal'),
  
  body('healthGoals.*.targetValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Target value must be a positive number'),
  
  body('medicalConditions')
    .optional()
    .isArray()
    .withMessage('Medical conditions must be an array'),
  
  body('medicalConditions.*.condition')
    .optional()
    .isIn(['diabetes_type1', 'diabetes_type2', 'hypertension', 'heart_disease', 'kidney_disease', 'liver_disease', 'thyroid_disorder', 'pcod_pcos', 'pregnancy', 'breastfeeding', 'post_surgery'])
    .withMessage('Invalid medical condition'),
  
  body('allergies')
    .optional()
    .isArray()
    .withMessage('Allergies must be an array'),
  
  body('allergies.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each allergy must be 1-50 characters'),
  
  body('dietaryRestrictions')
    .optional()
    .isArray()
    .withMessage('Dietary restrictions must be an array'),
  
  body('dietaryRestrictions.*.type')
    .optional()
    .isIn(['vegetarian', 'vegan', 'keto', 'paleo', 'gluten_free', 'dairy_free', 'low_carb', 'low_sodium'])
    .withMessage('Invalid dietary restriction type')
];

export const updateBasicInfoValidation = [
  body('age')
    .optional()
    .isInt({ min: 13, max: 120 })
    .withMessage('Age must be between 13 and 120'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  
  body('height')
    .optional()
    .isFloat({ min: 50, max: 250 })
    .withMessage('Height must be between 50 and 250 cm'),
  
  body('weight')
    .optional()
    .isFloat({ min: 20, max: 300 })
    .withMessage('Weight must be between 20 and 300 kg'),
  
  body('activityLevel')
    .optional()
    .isIn(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'])
    .withMessage('Invalid activity level')
];

export const updateDietaryRestrictionsValidation = [
  body('dietaryRestrictions')
    .isArray()
    .withMessage('Dietary restrictions must be an array'),
  
  body('dietaryRestrictions.*.type')
    .isIn(['vegetarian', 'vegan', 'keto', 'paleo', 'gluten_free', 'dairy_free', 'low_carb', 'low_sodium'])
    .withMessage('Invalid dietary restriction type'),
  
  body('dietaryRestrictions.*.severity')
    .optional()
    .isIn(['mild', 'moderate', 'severe'])
    .withMessage('Severity must be mild, moderate, or severe'),
  
  body('dietaryRestrictions.*.notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Notes cannot exceed 200 characters')
];

export const updateAllergiesValidation = [
  body('allergies')
    .isArray()
    .withMessage('Allergies must be an array'),
  
  body('allergies.*')
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each allergy must be 1-50 characters')
    .matches(/^[a-zA-Z\s-_]+$/)
    .withMessage('Allergies can only contain letters, spaces, hyphens, and underscores')
];

export const updateHealthGoalsValidation = [
  body('healthGoals')
    .isArray({ min: 1 })
    .withMessage('At least one health goal is required'),
  
  body('healthGoals.*.goal')
    .isIn(['weight_loss', 'weight_gain', 'muscle_gain', 'maintain_weight', 'improve_health', 'manage_diabetes', 'manage_hypertension', 'heart_health', 'digestive_health'])
    .withMessage('Invalid health goal'),
  
  body('healthGoals.*.targetValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Target value must be a positive number'),
  
  body('healthGoals.*.targetDate')
    .optional()
    .isISO8601()
    .withMessage('Target date must be a valid date'),
  
  body('healthGoals.*.priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high')
];

export const updateMedicalConditionsValidation = [
  body('medicalConditions')
    .isArray()
    .withMessage('Medical conditions must be an array'),
  
  body('medicalConditions.*.condition')
    .isIn(['diabetes_type1', 'diabetes_type2', 'hypertension', 'heart_disease', 'kidney_disease', 'liver_disease', 'thyroid_disorder', 'pcod_pcos', 'pregnancy', 'breastfeeding', 'post_surgery'])
    .withMessage('Invalid medical condition'),
  
  body('medicalConditions.*.severity')
    .optional()
    .isIn(['mild', 'moderate', 'severe'])
    .withMessage('Severity must be mild, moderate, or severe'),
  
  body('medicalConditions.*.diagnosed')
    .optional()
    .isISO8601()
    .withMessage('Diagnosed date must be a valid date'),
  
  body('medicalConditions.*.medications')
    .optional()
    .isArray()
    .withMessage('Medications must be an array'),
  
  body('medicalConditions.*.notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

export const addWeightEntryValidation = [
  body('weight')
    .isFloat({ min: 20, max: 300 })
    .withMessage('Weight must be between 20 and 300 kg'),
  
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Notes cannot exceed 200 characters')
];

export const getWeightHistoryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];