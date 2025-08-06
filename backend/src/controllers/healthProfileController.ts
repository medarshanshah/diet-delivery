import { Request, Response, NextFunction } from 'express';
import { HealthProfile } from '../models/HealthProfile';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';

// @desc    Get current user's health profile
// @route   GET /api/health-profile
// @access  Private
export const getHealthProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const healthProfile = await HealthProfile.findOne({ userId: req.user.id });

  if (!healthProfile) {
    return next(new AppError('Health profile not found', 404));
  }

  res.status(200).json({
    success: true,
    data: healthProfile
  });
});

// @desc    Create user's health profile
// @route   POST /api/health-profile
// @access  Private
export const createHealthProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check if health profile already exists
  const existingProfile = await HealthProfile.findOne({ userId: req.user.id });
  
  if (existingProfile) {
    return next(new AppError('Health profile already exists. Use update endpoint instead.', 400));
  }

  const healthProfileData = {
    ...req.body,
    userId: req.user.id
  };

  const healthProfile = await HealthProfile.create(healthProfileData);

  // Update user's hasHealthProfile flag
  await User.findByIdAndUpdate(req.user.id, { hasHealthProfile: true });

  res.status(201).json({
    success: true,
    message: 'Health profile created successfully',
    data: healthProfile
  });
});

// @desc    Update user's health profile
// @route   PUT /api/health-profile
// @access  Private
export const updateHealthProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let healthProfile = await HealthProfile.findOne({ userId: req.user.id });

  if (!healthProfile) {
    return next(new AppError('Health profile not found', 404));
  }

  // Update the health profile
  healthProfile = await HealthProfile.findOneAndUpdate(
    { userId: req.user.id },
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    message: 'Health profile updated successfully',
    data: healthProfile
  });
});

// @desc    Update dietary restrictions
// @route   PUT /api/health-profile/dietary-restrictions
// @access  Private
export const updateDietaryRestrictions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { dietaryRestrictions } = req.body;

  const healthProfile = await HealthProfile.findOneAndUpdate(
    { userId: req.user.id },
    { dietaryRestrictions },
    {
      new: true,
      runValidators: true
    }
  );

  if (!healthProfile) {
    return next(new AppError('Health profile not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Dietary restrictions updated successfully',
    data: { dietaryRestrictions: healthProfile.dietaryRestrictions }
  });
});

// @desc    Update allergies
// @route   PUT /api/health-profile/allergies
// @access  Private
export const updateAllergies = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { allergies } = req.body;

  const healthProfile = await HealthProfile.findOneAndUpdate(
    { userId: req.user.id },
    { allergies },
    {
      new: true,
      runValidators: true
    }
  );

  if (!healthProfile) {
    return next(new AppError('Health profile not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Allergies updated successfully',
    data: { allergies: healthProfile.allergies }
  });
});

// @desc    Update health goals
// @route   PUT /api/health-profile/goals
// @access  Private
export const updateHealthGoals = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { healthGoals } = req.body;

  const healthProfile = await HealthProfile.findOneAndUpdate(
    { userId: req.user.id },
    { healthGoals },
    {
      new: true,
      runValidators: true
    }
  );

  if (!healthProfile) {
    return next(new AppError('Health profile not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Health goals updated successfully',
    data: { healthGoals: healthProfile.healthGoals }
  });
});

// @desc    Update medical conditions
// @route   PUT /api/health-profile/medical-conditions
// @access  Private
export const updateMedicalConditions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { medicalConditions } = req.body;

  const healthProfile = await HealthProfile.findOneAndUpdate(
    { userId: req.user.id },
    { medicalConditions },
    {
      new: true,
      runValidators: true
    }
  );

  if (!healthProfile) {
    return next(new AppError('Health profile not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Medical conditions updated successfully',
    data: { medicalConditions: healthProfile.medicalConditions }
  });
});

// @desc    Update basic info (height, weight, age, etc.)
// @route   PUT /api/health-profile/basic-info
// @access  Private
export const updateBasicInfo = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { age, gender, height, weight, activityLevel } = req.body;

  const updateData: any = {};
  if (age !== undefined) updateData.age = age;
  if (gender !== undefined) updateData.gender = gender;
  if (height !== undefined) updateData.height = height;
  if (weight !== undefined) updateData.weight = weight;
  if (activityLevel !== undefined) updateData.activityLevel = activityLevel;

  const healthProfile = await HealthProfile.findOneAndUpdate(
    { userId: req.user.id },
    updateData,
    {
      new: true,
      runValidators: true
    }
  );

  if (!healthProfile) {
    return next(new AppError('Health profile not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Basic information updated successfully',
    data: {
      age: healthProfile.age,
      gender: healthProfile.gender,
      height: healthProfile.height,
      weight: healthProfile.weight,
      activityLevel: healthProfile.activityLevel,
      bmi: healthProfile.calculateBMI(),
      bmr: healthProfile.calculateBMR(),
      dailyCalories: healthProfile.calculateDailyCalories()
    }
  });
});

// @desc    Add weight entry to weight history
// @route   POST /api/health-profile/weight-history
// @access  Private
export const addWeightEntry = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { weight, notes } = req.body;

  const healthProfile = await HealthProfile.findOne({ userId: req.user.id });

  if (!healthProfile) {
    return next(new AppError('Health profile not found', 404));
  }

  // Add new weight entry
  healthProfile.weightHistory.push({
    weight,
    date: new Date(),
    notes: notes || ''
  });

  // Update current weight
  healthProfile.weight = weight;

  await healthProfile.save();

  res.status(200).json({
    success: true,
    message: 'Weight entry added successfully',
    data: {
      currentWeight: healthProfile.weight,
      bmi: healthProfile.calculateBMI(),
      weightHistory: healthProfile.weightHistory.slice(-10) // Return last 10 entries
    }
  });
});

// @desc    Get weight history
// @route   GET /api/health-profile/weight-history
// @access  Private
export const getWeightHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const healthProfile = await HealthProfile.findOne({ userId: req.user.id });

  if (!healthProfile) {
    return next(new AppError('Health profile not found', 404));
  }

  const limit = parseInt(req.query.limit as string) || 30;
  const weightHistory = healthProfile.weightHistory
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  res.status(200).json({
    success: true,
    data: {
      weightHistory,
      currentWeight: healthProfile.weight,
      startWeight: weightHistory[weightHistory.length - 1]?.weight || healthProfile.weight,
      weightChange: weightHistory.length > 1 ? 
        healthProfile.weight - weightHistory[weightHistory.length - 1].weight : 0
    }
  });
});

// @desc    Get nutrition recommendations
// @route   GET /api/health-profile/nutrition-recommendations
// @access  Private
export const getNutritionRecommendations = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const healthProfile = await HealthProfile.findOne({ userId: req.user.id });

  if (!healthProfile) {
    return next(new AppError('Health profile not found', 404));
  }

  const dailyCalories = healthProfile.calculateDailyCalories();
  const macroTargets = healthProfile.macroTargets;

  const recommendations = {
    dailyCalories,
    macroTargets,
    proteinGrams: Math.round((dailyCalories * macroTargets.protein / 100) / 4),
    carbsGrams: Math.round((dailyCalories * macroTargets.carbs / 100) / 4),
    fatsGrams: Math.round((dailyCalories * macroTargets.fats / 100) / 9),
    waterIntake: Math.round(healthProfile.weight * 35), // ml per kg body weight
    mealDistribution: {
      breakfast: Math.round(dailyCalories * 0.25),
      lunch: Math.round(dailyCalories * 0.35),
      dinner: Math.round(dailyCalories * 0.30),
      snacks: Math.round(dailyCalories * 0.10)
    }
  };

  res.status(200).json({
    success: true,
    data: recommendations
  });
});

// @desc    Delete health profile
// @route   DELETE /api/health-profile
// @access  Private
export const deleteHealthProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const healthProfile = await HealthProfile.findOneAndDelete({ userId: req.user.id });

  if (!healthProfile) {
    return next(new AppError('Health profile not found', 404));
  }

  // Update user's hasHealthProfile flag
  await User.findByIdAndUpdate(req.user.id, { hasHealthProfile: false });

  res.status(200).json({
    success: true,
    message: 'Health profile deleted successfully'
  });
});