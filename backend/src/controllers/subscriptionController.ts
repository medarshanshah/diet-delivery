import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order';
import { FoodItem } from '../models/FoodItem';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';
import { emailService } from '../services/emailService';
import { smsService } from '../services/smsService';

// @desc    Create subscription plan
// @route   POST /api/subscriptions
// @access  Private
export const createSubscription = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    items,
    subscriptionType, // 'daily', 'weekly', 'monthly'
    duration, // in days
    mealsPerDay = 1,
    startDate,
    deliveryTimes = ['12:00'], // Default lunch time
    deliveryAddress,
    specialInstructions,
    familyPlan = false,
    familyMembers = 1
  } = req.body;

  // Validate start date
  const startDateTime = new Date(startDate);
  if (startDateTime < new Date()) {
    return next(new AppError('Start date cannot be in the past', 400));
  }

  // Calculate end date
  const endDate = new Date(startDateTime);
  endDate.setDate(startDateTime.getDate() + duration);

  // Validate food items and calculate pricing
  let itemsPerMeal = 0;
  let basePricePerMeal = 0;
  const validatedItems = [];

  for (const item of items) {
    const foodItem = await FoodItem.findById(item.foodItemId);
    
    if (!foodItem) {
      return next(new AppError(`Food item with ID ${item.foodItemId} not found`, 404));
    }

    if (!foodItem.isAvailable) {
      return next(new AppError(`${foodItem.name} is currently unavailable`, 400));
    }

    itemsPerMeal += item.quantity;
    basePricePerMeal += foodItem.price * item.quantity;

    validatedItems.push({
      foodItemId: item.foodItemId,
      quantity: item.quantity,
      customizations: item.customizations || [],
      portionSize: item.portionSize,
      price: foodItem.price * item.quantity
    });
  }

  // Calculate subscription pricing
  const mealsPerPeriod = {
    daily: duration,
    weekly: Math.ceil(duration / 7) * 7, // Full weeks
    monthly: Math.ceil(duration / 30) * 30 // Full months
  };

  const totalMeals = mealsPerPeriod[subscriptionType as keyof typeof mealsPerPeriod] * mealsPerDay;
  const familyMultiplier = familyPlan ? familyMembers : 1;
  
  // Apply subscription discounts
  const discountRates = {
    daily: 0, // No discount for daily
    weekly: 0.05, // 5% discount for weekly
    monthly: 0.15 // 15% discount for monthly
  };

  const baseAmount = basePricePerMeal * totalMeals * familyMultiplier;
  const discountAmount = baseAmount * discountRates[subscriptionType as keyof typeof discountRates];
  const finalAmount = baseAmount - discountAmount;

  // Create subscription details
  const subscriptionDetails = {
    type: subscriptionType,
    duration,
    mealsPerDay,
    startDate: startDateTime,
    endDate,
    deliveryTimes,
    isActive: true,
    totalMeals,
    completedMeals: 0,
    pausedDates: [],
    familyPlan,
    familyMembers: familyPlan ? familyMembers : 1
  };

  // Create the initial subscription order
  const subscriptionOrder = await Order.create({
    userId: req.user.id,
    vendorId: validatedItems[0] ? (await FoodItem.findById(validatedItems[0].foodItemId))?.vendorId : null,
    items: validatedItems,
    orderType: 'subscription',
    subscriptionDetails,
    deliveryAddress,
    deliveryTime: startDateTime,
    specialInstructions,
    status: 'confirmed',
    payment: {
      method: 'pending',
      status: 'pending',
      amount: finalAmount
    },
    totalAmount: finalAmount,
    subtotal: baseAmount,
    deliveryFee: 0, // Free delivery for subscriptions
    discount: discountAmount,
    loyaltyPointsEarned: Math.floor(finalAmount / 50), // Double points for subscriptions
    isSubscription: true
  });

  // Schedule future orders (this would typically be done with a job queue)
  await scheduleSubscriptionMeals(subscriptionOrder);

  res.status(201).json({
    success: true,
    message: 'Subscription created successfully',
    data: {
      subscription: subscriptionOrder,
      pricing: {
        baseAmount,
        discountAmount,
        discountPercentage: discountRates[subscriptionType as keyof typeof discountRates] * 100,
        finalAmount,
        pricePerMeal: finalAmount / totalMeals
      }
    }
  });
});

// Helper function to schedule subscription meals
async function scheduleSubscriptionMeals(subscriptionOrder: any) {
  const { subscriptionDetails, items, deliveryAddress, specialInstructions } = subscriptionOrder;
  const scheduledOrders = [];

  let currentDate = new Date(subscriptionDetails.startDate);
  const endDate = new Date(subscriptionDetails.endDate);

  while (currentDate <= endDate) {
    // Skip if it's a paused date
    if (!subscriptionDetails.pausedDates.some((date: Date) => 
      date.toDateString() === currentDate.toDateString()
    )) {
      
      // Create orders for each meal time
      for (const deliveryTime of subscriptionDetails.deliveryTimes) {
        const [hours, minutes] = deliveryTime.split(':').map(Number);
        const deliveryDateTime = new Date(currentDate);
        deliveryDateTime.setHours(hours, minutes, 0, 0);

        // Don't create orders for the initial order date (already created)
        if (deliveryDateTime.getTime() !== subscriptionOrder.deliveryTime.getTime()) {
          const mealOrder = {
            userId: subscriptionOrder.userId,
            vendorId: subscriptionOrder.vendorId,
            items: items,
            orderType: 'subscription',
            subscriptionDetails: {
              parentSubscriptionId: subscriptionOrder._id,
              mealNumber: scheduledOrders.length + 1
            },
            deliveryAddress,
            deliveryTime: deliveryDateTime,
            specialInstructions,
            status: 'scheduled',
            totalAmount: subscriptionOrder.totalAmount / subscriptionDetails.totalMeals,
            subtotal: subscriptionOrder.subtotal / subscriptionDetails.totalMeals,
            deliveryFee: 0,
            isSubscription: true,
            parentSubscriptionId: subscriptionOrder._id
          };

          scheduledOrders.push(mealOrder);
        }
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Bulk create scheduled orders
  if (scheduledOrders.length > 0) {
    await Order.insertMany(scheduledOrders);
  }

  return scheduledOrders;
}

// @desc    Get user's subscriptions
// @route   GET /api/subscriptions
// @access  Private
export const getUserSubscriptions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { status = 'all', page = 1, limit = 10 } = req.query;

  let filter: any = { 
    userId: req.user.id, 
    orderType: 'subscription',
    parentSubscriptionId: { $exists: false } // Only parent subscriptions
  };

  if (status !== 'all') {
    if (status === 'active') {
      filter['subscriptionDetails.isActive'] = true;
      filter['subscriptionDetails.endDate'] = { $gte: new Date() };
    } else if (status === 'expired') {
      filter['subscriptionDetails.endDate'] = { $lt: new Date() };
    } else if (status === 'paused') {
      filter['subscriptionDetails.isActive'] = false;
    }
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const total = await Order.countDocuments(filter);
  const subscriptions = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('items.foodItemId', 'name images price category')
    .populate('vendorId', 'name rating');

  // Get upcoming meals for each subscription
  const subscriptionsWithUpcoming = await Promise.all(
    subscriptions.map(async (subscription) => {
      const upcomingMeals = await Order.find({
        parentSubscriptionId: subscription._id,
        status: 'scheduled',
        deliveryTime: { $gte: new Date() }
      })
      .sort({ deliveryTime: 1 })
      .limit(5)
      .populate('items.foodItemId', 'name images');

      return {
        ...subscription.toObject(),
        upcomingMeals
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      subscriptions: subscriptionsWithUpcoming,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    }
  });
});

// @desc    Get single subscription
// @route   GET /api/subscriptions/:id
// @access  Private
export const getSubscription = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const subscription = await Order.findById(req.params.id)
    .populate('items.foodItemId', 'name images price category nutrition')
    .populate('vendorId', 'name rating operatingHours');

  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  // Check ownership
  if (subscription.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to access this subscription', 403));
  }

  if (subscription.orderType !== 'subscription') {
    return next(new AppError('This is not a subscription order', 400));
  }

  // Get all related meals
  const relatedMeals = await Order.find({
    parentSubscriptionId: subscription._id
  })
  .sort({ deliveryTime: 1 })
  .populate('items.foodItemId', 'name images');

  // Calculate subscription statistics
  const stats = {
    totalMeals: subscription.subscriptionDetails.totalMeals,
    completedMeals: relatedMeals.filter(meal => meal.status === 'delivered').length,
    upcomingMeals: relatedMeals.filter(meal => 
      meal.status === 'scheduled' && meal.deliveryTime > new Date()
    ).length,
    missedMeals: relatedMeals.filter(meal => 
      meal.status === 'cancelled' || 
      (meal.status === 'scheduled' && meal.deliveryTime < new Date())
    ).length
  };

  res.status(200).json({
    success: true,
    data: {
      subscription,
      relatedMeals,
      stats
    }
  });
});

// @desc    Pause subscription
// @route   PUT /api/subscriptions/:id/pause
// @access  Private
export const pauseSubscription = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { pauseDates } = req.body; // Array of dates to pause

  const subscription = await Order.findById(req.params.id);

  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  // Check ownership
  if (subscription.userId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to modify this subscription', 403));
  }

  if (subscription.orderType !== 'subscription') {
    return next(new AppError('This is not a subscription order', 400));
  }

  // Add pause dates
  const newPauseDates = pauseDates.map((date: string) => new Date(date));
  subscription.subscriptionDetails.pausedDates.push(...newPauseDates);

  // Cancel scheduled orders for paused dates
  for (const pauseDate of newPauseDates) {
    await Order.updateMany({
      parentSubscriptionId: subscription._id,
      status: 'scheduled',
      deliveryTime: {
        $gte: new Date(pauseDate.toDateString()),
        $lt: new Date(pauseDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }, {
      status: 'cancelled',
      cancellationReason: 'Paused by customer'
    });
  }

  await subscription.save();

  res.status(200).json({
    success: true,
    message: 'Subscription paused for selected dates',
    data: subscription
  });
});

// @desc    Resume subscription
// @route   PUT /api/subscriptions/:id/resume
// @access  Private
export const resumeSubscription = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const subscription = await Order.findById(req.params.id);

  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  // Check ownership
  if (subscription.userId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to modify this subscription', 403));
  }

  if (subscription.orderType !== 'subscription') {
    return next(new AppError('This is not a subscription order', 400));
  }

  subscription.subscriptionDetails.isActive = true;
  await subscription.save();

  res.status(200).json({
    success: true,
    message: 'Subscription resumed successfully',
    data: subscription
  });
});

// @desc    Cancel subscription
// @route   DELETE /api/subscriptions/:id
// @access  Private
export const cancelSubscription = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { reason } = req.body;

  const subscription = await Order.findById(req.params.id);

  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  // Check ownership
  if (subscription.userId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to cancel this subscription', 403));
  }

  if (subscription.orderType !== 'subscription') {
    return next(new AppError('This is not a subscription order', 400));
  }

  // Mark subscription as inactive
  subscription.subscriptionDetails.isActive = false;
  subscription.cancellationReason = reason;
  subscription.status = 'cancelled';

  // Cancel all future scheduled meals
  await Order.updateMany({
    parentSubscriptionId: subscription._id,
    status: 'scheduled',
    deliveryTime: { $gte: new Date() }
  }, {
    status: 'cancelled',
    cancellationReason: 'Subscription cancelled'
  });

  await subscription.save();

  // Send cancellation confirmation
  try {
    const user = await User.findById(req.user.id);
    if (user && user.phone) {
      await smsService.sendSubscriptionReminderSMS(
        user.phone,
        'Subscription',
        'cancelled',
        'N/A'
      );
    }
  } catch (error) {
    console.error('Failed to send cancellation notification:', error);
  }

  res.status(200).json({
    success: true,
    message: 'Subscription cancelled successfully',
    data: subscription
  });
});

// @desc    Modify subscription items
// @route   PUT /api/subscriptions/:id/items
// @access  Private
export const modifySubscriptionItems = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { items, effectiveDate } = req.body;

  const subscription = await Order.findById(req.params.id);

  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  // Check ownership
  if (subscription.userId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to modify this subscription', 403));
  }

  if (subscription.orderType !== 'subscription') {
    return next(new AppError('This is not a subscription order', 400));
  }

  const effectiveDateTime = new Date(effectiveDate);

  // Validate new food items
  const validatedItems = [];
  let newPricePerMeal = 0;

  for (const item of items) {
    const foodItem = await FoodItem.findById(item.foodItemId);
    
    if (!foodItem) {
      return next(new AppError(`Food item with ID ${item.foodItemId} not found`, 404));
    }

    if (!foodItem.isAvailable) {
      return next(new AppError(`${foodItem.name} is currently unavailable`, 400));
    }

    newPricePerMeal += foodItem.price * item.quantity;

    validatedItems.push({
      foodItemId: item.foodItemId,
      quantity: item.quantity,
      customizations: item.customizations || [],
      portionSize: item.portionSize,
      price: foodItem.price * item.quantity
    });
  }

  // Update future scheduled orders with new items
  await Order.updateMany({
    parentSubscriptionId: subscription._id,
    status: 'scheduled',
    deliveryTime: { $gte: effectiveDateTime }
  }, {
    items: validatedItems,
    subtotal: newPricePerMeal,
    totalAmount: newPricePerMeal // Simplified - should recalculate with discounts
  });

  res.status(200).json({
    success: true,
    message: 'Subscription items updated successfully',
    data: {
      newItems: validatedItems,
      effectiveDate: effectiveDateTime,
      newPricePerMeal
    }
  });
});

// @desc    Get subscription meal history
// @route   GET /api/subscriptions/:id/meals
// @access  Private
export const getSubscriptionMeals = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { page = 1, limit = 20, status } = req.query;

  const subscription = await Order.findById(req.params.id);

  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  // Check ownership
  if (subscription.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to access this subscription', 403));
  }

  let filter: any = { parentSubscriptionId: subscription._id };

  if (status) {
    filter.status = status;
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const total = await Order.countDocuments(filter);
  const meals = await Order.find(filter)
    .sort({ deliveryTime: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('items.foodItemId', 'name images price category');

  res.status(200).json({
    success: true,
    data: {
      meals,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    }
  });
});

// @desc    Get subscription analytics
// @route   GET /api/subscriptions/:id/analytics
// @access  Private
export const getSubscriptionAnalytics = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const subscription = await Order.findById(req.params.id);

  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  // Check ownership
  if (subscription.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to access this subscription', 403));
  }

  // Get all meals for this subscription
  const meals = await Order.find({ parentSubscriptionId: subscription._id });

  // Calculate analytics
  const analytics = {
    totalMeals: meals.length,
    deliveredMeals: meals.filter(m => m.status === 'delivered').length,
    cancelledMeals: meals.filter(m => m.status === 'cancelled').length,
    upcomingMeals: meals.filter(m => m.status === 'scheduled' && m.deliveryTime > new Date()).length,
    totalSpent: meals.reduce((sum, m) => sum + m.totalAmount, 0),
    avgMealCost: meals.length > 0 ? meals.reduce((sum, m) => sum + m.totalAmount, 0) / meals.length : 0,
    deliveryRate: meals.length > 0 ? (meals.filter(m => m.status === 'delivered').length / meals.length) * 100 : 0,
    nutritionTotals: meals.reduce((totals, meal) => ({
      calories: totals.calories + (meal.nutritionTotal?.calories || 0),
      protein: totals.protein + (meal.nutritionTotal?.protein || 0),
      carbohydrates: totals.carbohydrates + (meal.nutritionTotal?.carbohydrates || 0),
      fats: totals.fats + (meal.nutritionTotal?.fats || 0)
    }), { calories: 0, protein: 0, carbohydrates: 0, fats: 0 }),
    weeklyBreakdown: getWeeklyBreakdown(meals),
    favoriteItems: await getFavoriteItems(meals)
  };

  res.status(200).json({
    success: true,
    data: analytics
  });
});

// Helper function to get weekly meal breakdown
function getWeeklyBreakdown(meals: any[]) {
  const weeklyData: { [key: string]: number } = {};
  
  meals.forEach(meal => {
    if (meal.status === 'delivered') {
      const week = getWeekOfYear(meal.deliveryTime);
      weeklyData[week] = (weeklyData[week] || 0) + 1;
    }
  });

  return Object.entries(weeklyData).map(([week, count]) => ({
    week,
    mealsDelivered: count
  }));
}

// Helper function to get favorite items
async function getFavoriteItems(meals: any[]) {
  const itemCounts: { [key: string]: number } = {};
  
  meals.forEach(meal => {
    if (meal.status === 'delivered') {
      meal.items.forEach((item: any) => {
        const itemId = item.foodItemId.toString();
        itemCounts[itemId] = (itemCounts[itemId] || 0) + item.quantity;
      });
    }
  });

  const sortedItems = Object.entries(itemCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const favoriteItems = [];
  for (const [itemId, count] of sortedItems) {
    const foodItem = await FoodItem.findById(itemId).select('name images');
    if (foodItem) {
      favoriteItems.push({
        foodItem,
        orderCount: count
      });
    }
  }

  return favoriteItems;
}

// Helper function to get week number
function getWeekOfYear(date: Date): string {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const week = Math.floor(diff / oneWeek);
  return `${date.getFullYear()}-W${week}`;
}