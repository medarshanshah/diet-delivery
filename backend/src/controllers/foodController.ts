import { Request, Response, NextFunction } from 'express';
import { FoodItem } from '../models/FoodItem';
import { HealthProfile } from '../models/HealthProfile';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';

// @desc    Get all food items with filters and pagination
// @route   GET /api/food/items
// @access  Public
export const getFoodItems = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    page = 1,
    limit = 12,
    category,
    dietaryTags,
    minPrice,
    maxPrice,
    minRating,
    isVegan,
    isVegetarian,
    isGlutenFree,
    isKeto,
    isDietitianApproved,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search
  } = req.query;

  // Build filter object
  const filter: any = { isAvailable: true };

  if (category) {
    filter['category.id'] = category;
  }

  if (dietaryTags) {
    const tags = Array.isArray(dietaryTags) ? dietaryTags : [dietaryTags];
    filter.dietaryTags = { $in: tags };
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice as string);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice as string);
  }

  if (minRating) {
    filter.rating = { $gte: parseFloat(minRating as string) };
  }

  if (isVegan === 'true') filter.isVegan = true;
  if (isVegetarian === 'true') filter.isVegetarian = true;
  if (isGlutenFree === 'true') filter.isGlutenFree = true;
  if (isKeto === 'true') filter.isKeto = true;
  if (isDietitianApproved === 'true') filter.isDietitianApproved = true;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { ingredients: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Get total count
  const total = await FoodItem.countDocuments(filter);

  // Get food items
  const foodItems = await FoodItem.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .populate('vendorId', 'name rating isVerified');

  res.status(200).json({
    success: true,
    data: {
      foodItems,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      }
    }
  });
});

// @desc    Get single food item
// @route   GET /api/food/items/:id
// @access  Public
export const getFoodItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const foodItem = await FoodItem.findById(req.params.id)
    .populate('vendorId', 'name rating isVerified operatingHours');

  if (!foodItem) {
    return next(new AppError('Food item not found', 404));
  }

  res.status(200).json({
    success: true,
    data: foodItem
  });
});

// @desc    Get personalized food recommendations
// @route   GET /api/food/recommendations
// @access  Private
export const getPersonalizedRecommendations = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { mealType = 'lunch', limit = 10 } = req.query;

  // Get user's health profile
  const healthProfile = await HealthProfile.findOne({ userId: req.user.id });

  let filter: any = { isAvailable: true, isDietitianApproved: true };
  let sort: any = { healthScore: -1, rating: -1 };

  if (healthProfile) {
    // Filter based on dietary restrictions
    const dietaryTypes = healthProfile.dietaryRestrictions?.map(dr => dr.type) || [];
    
    if (dietaryTypes.includes('vegan')) filter.isVegan = true;
    if (dietaryTypes.includes('vegetarian')) filter.isVegetarian = true;
    if (dietaryTypes.includes('gluten_free')) filter.isGlutenFree = true;
    if (dietaryTypes.includes('keto')) filter.isKeto = true;

    // Exclude allergens
    if (healthProfile.allergies && healthProfile.allergies.length > 0) {
      filter.allergens = { $nin: healthProfile.allergies };
    }

    // Filter by medical conditions
    const conditions = healthProfile.medicalConditions?.map(mc => mc.condition) || [];
    if (conditions.includes('diabetes_type1') || conditions.includes('diabetes_type2')) {
      filter.dietaryTags = { $in: ['diabetic_friendly', 'low_sugar'] };
    }
    if (conditions.includes('hypertension')) {
      filter.isLowSodium = true;
    }

    // Calorie filtering based on meal type and daily goals
    const dailyCalories = healthProfile.calculateDailyCalories();
    const mealCalorieTargets = {
      breakfast: dailyCalories * 0.25,
      lunch: dailyCalories * 0.35,
      dinner: dailyCalories * 0.30,
      snack: dailyCalories * 0.10
    };

    const targetCalories = mealCalorieTargets[mealType as keyof typeof mealCalorieTargets] || mealCalorieTargets.lunch;
    filter['nutrition.calories'] = {
      $gte: targetCalories * 0.7,
      $lte: targetCalories * 1.3
    };
  }

  const recommendations = await FoodItem.find(filter)
    .sort(sort)
    .limit(parseInt(limit as string))
    .populate('vendorId', 'name rating');

  res.status(200).json({
    success: true,
    data: {
      recommendations,
      mealType,
      criteriaUsed: healthProfile ? 'personalized' : 'general'
    }
  });
});

// @desc    Get food categories
// @route   GET /api/food/categories
// @access  Public
export const getFoodCategories = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const categories = await FoodItem.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: categories
  });
});

// @desc    Create food item (Vendor only)
// @route   POST /api/food/items
// @access  Private (Vendor/Admin)
export const createFoodItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const foodItemData = {
    ...req.body,
    vendorId: req.user.role === 'vendor' ? req.user.id : req.body.vendorId
  };

  const foodItem = await FoodItem.create(foodItemData);

  res.status(201).json({
    success: true,
    message: 'Food item created successfully',
    data: foodItem
  });
});

// @desc    Update food item
// @route   PUT /api/food/items/:id
// @access  Private (Vendor/Admin)
export const updateFoodItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let foodItem = await FoodItem.findById(req.params.id);

  if (!foodItem) {
    return next(new AppError('Food item not found', 404));
  }

  // Check ownership (vendors can only update their own items)
  if (req.user.role === 'vendor' && foodItem.vendorId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to update this food item', 403));
  }

  foodItem = await FoodItem.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    message: 'Food item updated successfully',
    data: foodItem
  });
});

// @desc    Delete food item
// @route   DELETE /api/food/items/:id
// @access  Private (Vendor/Admin)
export const deleteFoodItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const foodItem = await FoodItem.findById(req.params.id);

  if (!foodItem) {
    return next(new AppError('Food item not found', 404));
  }

  // Check ownership (vendors can only delete their own items)
  if (req.user.role === 'vendor' && foodItem.vendorId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to delete this food item', 403));
  }

  await FoodItem.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Food item deleted successfully'
  });
});

// @desc    Search food items with nutrition filters
// @route   POST /api/food/search
// @access  Public
export const searchFoodItems = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    query,
    nutritionFilters,
    maxCalories,
    minProtein,
    maxCarbs,
    maxFats,
    page = 1,
    limit = 12
  } = req.body;

  let filter: any = { isAvailable: true };

  // Text search
  if (query) {
    filter.$text = { $search: query };
  }

  // Nutrition filters
  if (maxCalories) {
    filter['nutrition.calories'] = { $lte: maxCalories };
  }
  if (minProtein) {
    filter['nutrition.protein'] = { $gte: minProtein };
  }
  if (maxCarbs) {
    filter['nutrition.carbohydrates'] = { $lte: maxCarbs };
  }
  if (maxFats) {
    filter['nutrition.fats'] = { $lte: maxFats };
  }

  // Additional nutrition filters
  if (nutritionFilters) {
    Object.keys(nutritionFilters).forEach(key => {
      if (nutritionFilters[key]) {
        filter[`nutrition.${key}`] = nutritionFilters[key];
      }
    });
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const total = await FoodItem.countDocuments(filter);
  const foodItems = await FoodItem.find(filter)
    .sort({ score: { $meta: 'textScore' }, healthScore: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('vendorId', 'name rating');

  res.status(200).json({
    success: true,
    data: {
      foodItems,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    }
  });
});

// @desc    Get nutrition compatibility for user
// @route   GET /api/food/items/:id/compatibility
// @access  Private
export const getNutritionCompatibility = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const foodItem = await FoodItem.findById(req.params.id);
  
  if (!foodItem) {
    return next(new AppError('Food item not found', 404));
  }

  const healthProfile = await HealthProfile.findOne({ userId: req.user.id });
  
  if (!healthProfile) {
    return res.status(200).json({
      success: true,
      data: {
        compatible: true,
        warnings: [],
        recommendations: []
      }
    });
  }

  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check allergies
  const userAllergies = healthProfile.allergies || [];
  const foodAllergens = foodItem.allergens || [];
  const allergenMatches = userAllergies.filter(allergy => 
    foodAllergens.some(allergen => 
      allergen.toLowerCase().includes(allergy.toLowerCase())
    )
  );

  if (allergenMatches.length > 0) {
    warnings.push(`Contains allergens: ${allergenMatches.join(', ')}`);
  }

  // Check dietary restrictions
  const dietaryRestrictions = healthProfile.dietaryRestrictions || [];
  const isCompatible = foodItem.checkDietaryCompatibility(
    dietaryRestrictions.map(dr => dr.type)
  );

  if (!isCompatible) {
    warnings.push('May not be compatible with your dietary restrictions');
  }

  // Check medical conditions
  const medicalConditions = healthProfile.medicalConditions?.map(mc => mc.condition) || [];
  
  if (medicalConditions.includes('diabetes_type1') || medicalConditions.includes('diabetes_type2')) {
    if (foodItem.nutrition.sugar > 15) {
      warnings.push('High sugar content - monitor blood glucose levels');
    }
    if (foodItem.nutrition.carbohydrates > 45) {
      recommendations.push('Consider smaller portion size due to high carb content');
    }
  }

  if (medicalConditions.includes('hypertension')) {
    if (foodItem.nutrition.sodium > 600) {
      warnings.push('High sodium content - may affect blood pressure');
    }
  }

  // Calorie recommendations
  const dailyCalories = healthProfile.calculateDailyCalories();
  const mealCalories = foodItem.nutrition.calories;
  
  if (mealCalories > dailyCalories * 0.4) {
    recommendations.push('This meal is high in calories for your daily target');
  }

  const compatible = warnings.length === 0;

  res.status(200).json({
    success: true,
    data: {
      compatible,
      warnings,
      recommendations,
      nutritionInfo: foodItem.nutrition,
      healthScore: foodItem.healthScore
    }
  });
});