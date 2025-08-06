import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order';
import { FoodItem } from '../models/FoodItem';
import { HealthProfile } from '../models/HealthProfile';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';
import { emailService } from '../services/emailService';
import { smsService } from '../services/smsService';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    items,
    orderType = 'single',
    subscriptionDetails,
    deliveryAddress,
    deliveryTime,
    specialInstructions,
    paymentMethod,
    hospitalDetails,
    promoCode
  } = req.body;

  // Validate food items and calculate totals
  let subtotal = 0;
  let totalNutrition = {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fats: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  };

  const validatedItems = [];

  for (const item of items) {
    const foodItem = await FoodItem.findById(item.foodItemId);
    
    if (!foodItem) {
      return next(new AppError(`Food item with ID ${item.foodItemId} not found`, 404));
    }

    if (!foodItem.isAvailable) {
      return next(new AppError(`${foodItem.name} is currently unavailable`, 400));
    }

    // Calculate item total with customizations
    let itemPrice = foodItem.price * item.quantity;
    
    // Apply portion size multiplier if specified
    if (item.portionSize) {
      const portionOption = foodItem.portionSizes.find(p => p.name === item.portionSize);
      if (portionOption) {
        itemPrice *= portionOption.priceMultiplier;
      }
    }

    // Apply customization price changes
    if (item.customizations && item.customizations.length > 0) {
      for (const customization of item.customizations) {
        const customOption = foodItem.customizations
          .flatMap(c => c.options)
          .find(o => o.name === customization);
        if (customOption) {
          itemPrice += customOption.priceChange * item.quantity;
        }
      }
    }

    subtotal += itemPrice;

    // Calculate nutrition totals
    const itemNutrition = {
      calories: foodItem.nutrition.calories * item.quantity,
      protein: foodItem.nutrition.protein * item.quantity,
      carbohydrates: foodItem.nutrition.carbohydrates * item.quantity,
      fats: foodItem.nutrition.fats * item.quantity,
      fiber: foodItem.nutrition.fiber * item.quantity,
      sugar: foodItem.nutrition.sugar * item.quantity,
      sodium: foodItem.nutrition.sodium * item.quantity
    };

    Object.keys(totalNutrition).forEach(key => {
      totalNutrition[key as keyof typeof totalNutrition] += itemNutrition[key as keyof typeof itemNutrition];
    });

    validatedItems.push({
      foodItemId: item.foodItemId,
      quantity: item.quantity,
      customizations: item.customizations || [],
      portionSize: item.portionSize,
      price: itemPrice,
      nutritionTotal: itemNutrition
    });
  }

  // Calculate delivery fee (simplified logic)
  let deliveryFee = 0;
  if (orderType === 'single') {
    deliveryFee = subtotal >= 1000 ? 0 : 100; // Free delivery above Rs. 1000
  } else if (orderType === 'hospital_package') {
    deliveryFee = 50; // Reduced fee for hospital orders
  }

  // Apply discounts (placeholder for promo code logic)
  let discount = 0;
  if (promoCode) {
    // TODO: Implement promo code validation and discount calculation
    discount = subtotal * 0.1; // 10% discount for demo
  }

  const totalAmount = subtotal + deliveryFee - discount;

  // Calculate loyalty points
  const loyaltyPointsEarned = Math.floor(totalAmount / 100); // 1 point per Rs. 100

  // Create order
  const orderData = {
    userId: req.user.id,
    vendorId: validatedItems[0] ? (await FoodItem.findById(validatedItems[0].foodItemId))?.vendorId : null,
    items: validatedItems,
    orderType,
    subscriptionDetails: orderType === 'subscription' ? subscriptionDetails : undefined,
    deliveryAddress,
    deliveryTime: deliveryTime ? new Date(deliveryTime) : new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    specialInstructions,
    status: 'pending',
    payment: {
      method: paymentMethod,
      status: 'pending',
      amount: totalAmount
    },
    totalAmount,
    subtotal,
    deliveryFee,
    discount,
    loyaltyPointsEarned,
    nutritionTotal: totalNutrition,
    isHospitalOrder: orderType === 'hospital_package',
    hospitalDetails: orderType === 'hospital_package' ? hospitalDetails : undefined
  };

  const order = await Order.create(orderData);

  // Send confirmation emails/SMS
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      await emailService.sendOrderConfirmationEmail(user.email, user.name, order);
      if (user.phone) {
        await smsService.sendOrderStatusSMS(user.phone, order.orderNumber, 'confirmed');
      }
    }
  } catch (error) {
    console.error('Failed to send order confirmation:', error);
  }

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: order
  });
});

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
export const getUserOrders = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    page = 1,
    limit = 10,
    status,
    orderType,
    startDate,
    endDate
  } = req.query;

  const filter: any = { userId: req.user.id };

  if (status) {
    filter.status = status;
  }

  if (orderType) {
    filter.orderType = orderType;
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate as string);
    if (endDate) filter.createdAt.$lte = new Date(endDate as string);
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('items.foodItemId', 'name images price category')
    .populate('vendorId', 'name rating');

  res.status(200).json({
    success: true,
    data: {
      orders,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    }
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const order = await Order.findById(req.params.id)
    .populate('items.foodItemId', 'name images price category nutrition')
    .populate('vendorId', 'name rating operatingHours')
    .populate('userId', 'name email phone');

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Check ownership or admin access
  if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to access this order', 403));
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Update order status (Admin/Vendor only)
// @route   PUT /api/orders/:id/status
// @access  Private (Admin/Vendor)
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { status, notes } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Check authorization
  if (req.user.role === 'vendor' && order.vendorId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to update this order', 403));
  }

  // Update status
  order.status = status;
  
  // Add to status history
  order.statusHistory.push({
    status,
    timestamp: new Date(),
    notes: notes || `Order ${status} by ${req.user.role}`
  });

  await order.save();

  // Send status update notifications
  try {
    const user = await User.findById(order.userId);
    if (user) {
      if (user.phone) {
        await smsService.sendOrderStatusSMS(user.phone, order.orderNumber, status);
      }
    }
  } catch (error) {
    console.error('Failed to send status update:', error);
  }

  res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    data: order
  });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { reason } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Check ownership
  if (order.userId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to cancel this order', 403));
  }

  // Check if order can be cancelled
  if (!order.canBeCancelled()) {
    return next(new AppError('Order cannot be cancelled at this stage', 400));
  }

  order.status = 'cancelled';
  order.cancellationReason = reason;
  order.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    notes: `Cancelled by customer: ${reason}`
  });

  await order.save();

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    data: order
  });
});

// @desc    Rate and review order
// @route   POST /api/orders/:id/review
// @access  Private
export const reviewOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { foodRating, deliveryRating, overallRating, review } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Check ownership
  if (order.userId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to review this order', 403));
  }

  // Check if order is completed
  if (order.status !== 'delivered') {
    return next(new AppError('Can only review completed orders', 400));
  }

  // Check if already reviewed
  if (order.customerRating) {
    return next(new AppError('Order has already been reviewed', 400));
  }

  order.customerRating = {
    foodRating,
    deliveryRating,
    overallRating,
    review,
    createdAt: new Date()
  };

  await order.save();

  // Update food item ratings (simplified - in production, this should be more sophisticated)
  for (const item of order.items) {
    const foodItem = await FoodItem.findById(item.foodItemId);
    if (foodItem) {
      const newReviewCount = foodItem.reviewCount + 1;
      const newRating = ((foodItem.rating * foodItem.reviewCount) + foodRating) / newReviewCount;
      
      foodItem.rating = Math.round(newRating * 10) / 10; // Round to 1 decimal place
      foodItem.reviewCount = newReviewCount;
      await foodItem.save();
    }
  }

  res.status(200).json({
    success: true,
    message: 'Review submitted successfully',
    data: order
  });
});

// @desc    Get order nutrition summary
// @route   GET /api/orders/:id/nutrition
// @access  Private
export const getOrderNutrition = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const order = await Order.findById(req.params.id)
    .populate('items.foodItemId', 'name nutrition');

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Check ownership
  if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to access this order', 403));
  }

  // Get user's health profile for comparison
  const healthProfile = await HealthProfile.findOne({ userId: order.userId });
  
  let dailyTargets = null;
  let comparisonData = null;

  if (healthProfile) {
    dailyTargets = {
      calories: healthProfile.calculateDailyCalories(),
      protein: healthProfile.macroTargets.protein,
      carbs: healthProfile.macroTargets.carbs,
      fats: healthProfile.macroTargets.fats
    };

    comparisonData = {
      caloriePercentage: (order.nutritionTotal.calories / dailyTargets.calories) * 100,
      proteinPercentage: ((order.nutritionTotal.protein * 4) / (dailyTargets.calories * dailyTargets.protein / 100)) * 100,
      carbsPercentage: ((order.nutritionTotal.carbohydrates * 4) / (dailyTargets.calories * dailyTargets.carbs / 100)) * 100,
      fatsPercentage: ((order.nutritionTotal.fats * 9) / (dailyTargets.calories * dailyTargets.fats / 100)) * 100
    };
  }

  res.status(200).json({
    success: true,
    data: {
      orderNutrition: order.nutritionTotal,
      dailyTargets,
      comparisonData,
      itemBreakdown: order.items.map(item => ({
        foodItemId: item.foodItemId,
        quantity: item.quantity,
        nutrition: item.nutritionTotal
      }))
    }
  });
});

// @desc    Repeat last order
// @route   POST /api/orders/repeat/:id
// @access  Private
export const repeatOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const originalOrder = await Order.findById(req.params.id)
    .populate('items.foodItemId');

  if (!originalOrder) {
    return next(new AppError('Original order not found', 404));
  }

  // Check ownership
  if (originalOrder.userId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to repeat this order', 403));
  }

  // Check if all items are still available
  const unavailableItems = [];
  for (const item of originalOrder.items) {
    const foodItem = await FoodItem.findById(item.foodItemId);
    if (!foodItem || !foodItem.isAvailable) {
      unavailableItems.push(foodItem?.name || 'Unknown item');
    }
  }

  if (unavailableItems.length > 0) {
    return next(new AppError(`Some items are no longer available: ${unavailableItems.join(', ')}`, 400));
  }

  // Create new order with same items and details
  const newOrderData = {
    userId: req.user.id,
    vendorId: originalOrder.vendorId,
    items: originalOrder.items.map(item => ({
      foodItemId: item.foodItemId,
      quantity: item.quantity,
      customizations: item.customizations,
      portionSize: item.portionSize,
      price: item.price,
      nutritionTotal: item.nutritionTotal
    })),
    orderType: originalOrder.orderType,
    deliveryAddress: originalOrder.deliveryAddress,
    deliveryTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    specialInstructions: originalOrder.specialInstructions,
    status: 'pending',
    payment: {
      method: 'pending', // User will need to select payment method
      status: 'pending',
      amount: originalOrder.totalAmount
    },
    totalAmount: originalOrder.totalAmount,
    subtotal: originalOrder.subtotal,
    deliveryFee: originalOrder.deliveryFee,
    discount: 0, // Reset discount
    loyaltyPointsEarned: originalOrder.loyaltyPointsEarned,
    nutritionTotal: originalOrder.nutritionTotal,
    isHospitalOrder: originalOrder.isHospitalOrder,
    hospitalDetails: originalOrder.hospitalDetails
  };

  const newOrder = await Order.create(newOrderData);

  res.status(201).json({
    success: true,
    message: 'Order repeated successfully',
    data: newOrder
  });
});

// @desc    Get order statistics for user
// @route   GET /api/orders/stats
// @access  Private
export const getUserOrderStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { period = '30' } = req.query; // days

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period as string));

  const stats = await Order.aggregate([
    {
      $match: {
        userId: req.user.id,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
        totalCalories: { $sum: '$nutritionTotal.calories' },
        totalProtein: { $sum: '$nutritionTotal.protein' },
        avgOrderValue: { $avg: '$totalAmount' },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);

  const result = stats[0] || {
    totalOrders: 0,
    totalSpent: 0,
    totalCalories: 0,
    totalProtein: 0,
    avgOrderValue: 0,
    completedOrders: 0,
    cancelledOrders: 0
  };

  res.status(200).json({
    success: true,
    data: {
      period: `${period} days`,
      ...result,
      completionRate: result.totalOrders > 0 ? (result.completedOrders / result.totalOrders) * 100 : 0
    }
  });
});