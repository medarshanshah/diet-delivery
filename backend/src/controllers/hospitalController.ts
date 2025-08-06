import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order';
import { FoodItem } from '../models/FoodItem';
import { User } from '../models/User';
import { HealthProfile } from '../models/HealthProfile';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';
import { emailService } from '../services/emailService';
import { smsService } from '../services/smsService';

// Hospital meal packages configuration
const HOSPITAL_PACKAGES = {
  patient_recovery: {
    name: 'Patient Recovery Package',
    description: 'Nutritionally balanced meals for post-surgery and recovery patients',
    dietaryGuidelines: ['high_protein', 'low_sodium', 'easy_digest'],
    duration: 7, // days
    mealsPerDay: 3,
    basePrice: 2000,
    includes: ['breakfast', 'lunch', 'dinner']
  },
  diabetic_care: {
    name: 'Diabetic Care Package',
    description: 'Specially designed meals for diabetic patients',
    dietaryGuidelines: ['diabetic_friendly', 'low_sugar', 'high_fiber'],
    duration: 14,
    mealsPerDay: 3,
    basePrice: 2500,
    includes: ['breakfast', 'lunch', 'dinner', 'evening_snack']
  },
  cardiac_care: {
    name: 'Cardiac Care Package',
    description: 'Heart-healthy meals for cardiac patients',
    dietaryGuidelines: ['heart_healthy', 'low_sodium', 'low_cholesterol'],
    duration: 10,
    mealsPerDay: 3,
    basePrice: 2200,
    includes: ['breakfast', 'lunch', 'dinner']
  },
  maternity_care: {
    name: 'Maternity Care Package',
    description: 'Nutritious meals for new mothers',
    dietaryGuidelines: ['high_protein', 'high_calcium', 'iron_rich'],
    duration: 15,
    mealsPerDay: 4,
    basePrice: 3000,
    includes: ['breakfast', 'lunch', 'dinner', 'evening_snack']
  },
  family_support: {
    name: 'Family Support Package',
    description: 'Comfort meals for family members staying at hospital',
    dietaryGuidelines: ['comfort_food', 'nutritious', 'home_style'],
    duration: 5,
    mealsPerDay: 2,
    basePrice: 1500,
    includes: ['lunch', 'dinner']
  },
  emergency_support: {
    name: 'Emergency Support Package',
    description: 'Quick meal delivery for emergency situations',
    dietaryGuidelines: ['quick_prep', 'nutritious', 'easy_eat'],
    duration: 1,
    mealsPerDay: 1,
    basePrice: 300,
    includes: ['meal']
  }
};

// @desc    Get available hospital packages
// @route   GET /api/hospital/packages
// @access  Public
export const getHospitalPackages = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { category, duration } = req.query;

  let packages = Object.entries(HOSPITAL_PACKAGES).map(([id, pkg]) => ({
    id,
    ...pkg
  }));

  // Filter by category if specified
  if (category) {
    packages = packages.filter(pkg => pkg.id.includes(category as string));
  }

  // Filter by duration if specified
  if (duration) {
    const maxDuration = parseInt(duration as string);
    packages = packages.filter(pkg => pkg.duration <= maxDuration);
  }

  res.status(200).json({
    success: true,
    data: packages
  });
});

// @desc    Create hospital package booking
// @route   POST /api/hospital/book
// @access  Private
export const createHospitalBooking = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    packageId,
    hospitalInfo,
    patientInfo,
    duration,
    startDate,
    mealsPerDay,
    deliveryAddress,
    emergencyContact,
    specialInstructions,
    dietaryModifications,
    paymentMethod
  } = req.body;

  // Validate package exists
  const packageInfo = HOSPITAL_PACKAGES[packageId as keyof typeof HOSPITAL_PACKAGES];
  if (!packageInfo) {
    return next(new AppError('Invalid hospital package selected', 400));
  }

  // Validate start date
  const startDateTime = new Date(startDate);
  if (startDateTime < new Date()) {
    return next(new AppError('Start date cannot be in the past', 400));
  }

  // Calculate end date
  const bookingDuration = duration || packageInfo.duration;
  const endDate = new Date(startDateTime);
  endDate.setDate(startDateTime.getDate() + bookingDuration);

  // Get suitable food items based on package guidelines
  const suitableFoodItems = await FoodItem.find({
    isAvailable: true,
    isDietitianApproved: true,
    dietaryTags: { $in: packageInfo.dietaryGuidelines }
  }).limit(10);

  if (suitableFoodItems.length === 0) {
    return next(new AppError('No suitable food items available for this package', 400));
  }

  // Create meal items based on package configuration
  const mealItems = suitableFoodItems.slice(0, mealsPerDay || packageInfo.mealsPerDay).map(item => ({
    foodItemId: item._id,
    quantity: 1,
    customizations: [],
    price: item.price
  }));

  // Calculate pricing with hospital package discount
  const baseMealPrice = mealItems.reduce((sum, item) => sum + item.price, 0);
  const totalMeals = bookingDuration * (mealsPerDay || packageInfo.mealsPerDay);
  const subtotal = baseMealPrice * totalMeals;
  
  // Apply hospital package discount (20% off regular pricing)
  const hospitalDiscount = subtotal * 0.2;
  const totalAmount = subtotal - hospitalDiscount;

  // Create hospital details
  const hospitalDetails = {
    packageId,
    packageName: packageInfo.name,
    hospitalInfo: {
      name: hospitalInfo.name,
      address: hospitalInfo.address,
      ward: hospitalInfo.ward,
      roomNumber: hospitalInfo.roomNumber,
      contactNumber: hospitalInfo.contactNumber
    },
    patientInfo: {
      name: patientInfo.name,
      age: patientInfo.age,
      condition: patientInfo.condition,
      admissionDate: new Date(patientInfo.admissionDate),
      doctorName: patientInfo.doctorName,
      allergies: patientInfo.allergies || [],
      dietaryRestrictions: patientInfo.dietaryRestrictions || []
    },
    emergencyContact: {
      name: emergencyContact.name,
      relationship: emergencyContact.relationship,
      phone: emergencyContact.phone
    },
    duration: bookingDuration,
    startDate: startDateTime,
    endDate,
    mealsPerDay: mealsPerDay || packageInfo.mealsPerDay,
    deliverySchedule: packageInfo.includes,
    specialInstructions,
    dietaryModifications: dietaryModifications || []
  };

  // Create the hospital package order
  const hospitalOrder = await Order.create({
    userId: req.user.id,
    vendorId: suitableFoodItems[0]?.vendorId,
    items: mealItems,
    orderType: 'hospital_package',
    deliveryAddress,
    deliveryTime: startDateTime,
    specialInstructions: `Hospital Package: ${packageInfo.name}. ${specialInstructions || ''}`,
    status: 'confirmed',
    payment: {
      method: paymentMethod,
      status: 'pending',
      amount: totalAmount
    },
    totalAmount,
    subtotal,
    deliveryFee: 0, // Free delivery for hospital packages
    discount: hospitalDiscount,
    loyaltyPointsEarned: 0, // No loyalty points for hospital packages
    isHospitalOrder: true,
    hospitalDetails
  });

  // Schedule daily meal deliveries
  await scheduleHospitalMeals(hospitalOrder);

  // Send confirmation to user and hospital
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      await emailService.sendOrderConfirmationEmail(user.email, user.name, hospitalOrder);
      if (user.phone) {
        await smsService.sendOrderStatusSMS(user.phone, hospitalOrder.orderNumber, 'confirmed');
      }
    }

    // Send notification to hospital contact
    if (hospitalInfo.contactNumber) {
      await smsService.sendSMS(
        hospitalInfo.contactNumber,
        `Hospital meal package confirmed for patient ${patientInfo.name} in ${hospitalInfo.ward} ${hospitalInfo.roomNumber}. Order #${hospitalOrder.orderNumber}. Delivery starts ${startDateTime.toLocaleDateString()}.`
      );
    }
  } catch (error) {
    console.error('Failed to send hospital booking confirmation:', error);
  }

  res.status(201).json({
    success: true,
    message: 'Hospital package booked successfully',
    data: {
      booking: hospitalOrder,
      package: packageInfo,
      deliverySchedule: await getDeliverySchedule(hospitalOrder)
    }
  });
});

// Helper function to schedule hospital meals
async function scheduleHospitalMeals(hospitalOrder: any) {
  const { hospitalDetails, items, deliveryAddress } = hospitalOrder;
  const scheduledOrders = [];

  let currentDate = new Date(hospitalDetails.startDate);
  const endDate = new Date(hospitalDetails.endDate);

  while (currentDate <= endDate) {
    // Create meals for each delivery time
    for (const mealType of hospitalDetails.deliverySchedule) {
      const deliveryTime = getMealDeliveryTime(currentDate, mealType);

      // Don't create order for the initial order (already created)
      if (deliveryTime.getTime() !== hospitalOrder.deliveryTime.getTime()) {
        const mealOrder = {
          userId: hospitalOrder.userId,
          vendorId: hospitalOrder.vendorId,
          items: items,
          orderType: 'hospital_package',
          deliveryAddress,
          deliveryTime,
          specialInstructions: `Hospital meal delivery - ${mealType} for ${hospitalDetails.patientInfo.name}`,
          status: 'scheduled',
          totalAmount: hospitalOrder.totalAmount / (hospitalDetails.duration * hospitalDetails.mealsPerDay),
          subtotal: hospitalOrder.subtotal / (hospitalDetails.duration * hospitalDetails.mealsPerDay),
          deliveryFee: 0,
          isHospitalOrder: true,
          hospitalDetails: {
            ...hospitalDetails,
            mealType,
            parentBookingId: hospitalOrder._id
          },
          parentBookingId: hospitalOrder._id
        };

        scheduledOrders.push(mealOrder);
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

// Helper function to get meal delivery times
function getMealDeliveryTime(date: Date, mealType: string): Date {
  const deliveryTime = new Date(date);
  
  switch (mealType) {
    case 'breakfast':
      deliveryTime.setHours(7, 30, 0, 0);
      break;
    case 'lunch':
      deliveryTime.setHours(12, 0, 0, 0);
      break;
    case 'dinner':
      deliveryTime.setHours(18, 30, 0, 0);
      break;
    case 'evening_snack':
      deliveryTime.setHours(16, 0, 0, 0);
      break;
    default:
      deliveryTime.setHours(12, 0, 0, 0);
  }

  return deliveryTime;
}

// @desc    Get user's hospital bookings
// @route   GET /api/hospital/bookings
// @access  Private
export const getHospitalBookings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { status = 'all', page = 1, limit = 10 } = req.query;

  let filter: any = { 
    userId: req.user.id, 
    orderType: 'hospital_package',
    parentBookingId: { $exists: false } // Only parent bookings
  };

  if (status !== 'all') {
    if (status === 'active') {
      filter.status = { $in: ['confirmed', 'preparing', 'out_for_delivery'] };
      filter['hospitalDetails.endDate'] = { $gte: new Date() };
    } else if (status === 'completed') {
      filter.status = 'delivered';
    } else if (status === 'cancelled') {
      filter.status = 'cancelled';
    }
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const total = await Order.countDocuments(filter);
  const bookings = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('items.foodItemId', 'name images price category');

  // Get upcoming deliveries for each booking
  const bookingsWithDeliveries = await Promise.all(
    bookings.map(async (booking) => {
      const upcomingDeliveries = await Order.find({
        parentBookingId: booking._id,
        status: 'scheduled',
        deliveryTime: { $gte: new Date() }
      })
      .sort({ deliveryTime: 1 })
      .limit(5);

      return {
        ...booking.toObject(),
        upcomingDeliveries
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      bookings: bookingsWithDeliveries,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    }
  });
});

// @desc    Get single hospital booking
// @route   GET /api/hospital/bookings/:id
// @access  Private
export const getHospitalBooking = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const booking = await Order.findById(req.params.id)
    .populate('items.foodItemId', 'name images price category nutrition');

  if (!booking) {
    return next(new AppError('Hospital booking not found', 404));
  }

  // Check ownership
  if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to access this booking', 403));
  }

  if (booking.orderType !== 'hospital_package') {
    return next(new AppError('This is not a hospital package booking', 400));
  }

  // Get all related meal deliveries
  const relatedDeliveries = await Order.find({
    parentBookingId: booking._id
  })
  .sort({ deliveryTime: 1 })
  .populate('items.foodItemId', 'name images');

  // Calculate booking statistics
  const stats = {
    totalDeliveries: relatedDeliveries.length,
    completedDeliveries: relatedDeliveries.filter(d => d.status === 'delivered').length,
    upcomingDeliveries: relatedDeliveries.filter(d => 
      d.status === 'scheduled' && d.deliveryTime > new Date()
    ).length,
    missedDeliveries: relatedDeliveries.filter(d => 
      d.status === 'cancelled' || 
      (d.status === 'scheduled' && d.deliveryTime < new Date())
    ).length
  };

  res.status(200).json({
    success: true,
    data: {
      booking,
      relatedDeliveries,
      stats,
      deliverySchedule: await getDeliverySchedule(booking)
    }
  });
});

// Helper function to get delivery schedule
async function getDeliverySchedule(booking: any) {
  const schedule = [];
  let currentDate = new Date(booking.hospitalDetails.startDate);
  const endDate = new Date(booking.hospitalDetails.endDate);

  while (currentDate <= endDate) {
    const daySchedule = {
      date: new Date(currentDate),
      meals: []
    };

    for (const mealType of booking.hospitalDetails.deliverySchedule) {
      const deliveryTime = getMealDeliveryTime(currentDate, mealType);
      daySchedule.meals.push({
        mealType,
        deliveryTime,
        status: deliveryTime < new Date() ? 'completed' : 'scheduled'
      });
    }

    schedule.push(daySchedule);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedule;
}

// @desc    Modify hospital booking
// @route   PUT /api/hospital/bookings/:id
// @access  Private
export const modifyHospitalBooking = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { dietaryModifications, specialInstructions, emergencyContact } = req.body;

  const booking = await Order.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Hospital booking not found', 404));
  }

  // Check ownership
  if (booking.userId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to modify this booking', 403));
  }

  if (booking.orderType !== 'hospital_package') {
    return next(new AppError('This is not a hospital package booking', 400));
  }

  // Update booking details
  if (dietaryModifications) {
    booking.hospitalDetails.dietaryModifications = dietaryModifications;
  }

  if (specialInstructions) {
    booking.hospitalDetails.specialInstructions = specialInstructions;
  }

  if (emergencyContact) {
    booking.hospitalDetails.emergencyContact = emergencyContact;
  }

  await booking.save();

  // Update future scheduled deliveries
  await Order.updateMany({
    parentBookingId: booking._id,
    status: 'scheduled',
    deliveryTime: { $gte: new Date() }
  }, {
    specialInstructions: `Hospital meal delivery - Updated instructions: ${specialInstructions || ''}`
  });

  res.status(200).json({
    success: true,
    message: 'Hospital booking updated successfully',
    data: booking
  });
});

// @desc    Cancel hospital booking
// @route   DELETE /api/hospital/bookings/:id
// @access  Private
export const cancelHospitalBooking = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { reason } = req.body;

  const booking = await Order.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Hospital booking not found', 404));
  }

  // Check ownership
  if (booking.userId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to cancel this booking', 403));
  }

  if (booking.orderType !== 'hospital_package') {
    return next(new AppError('This is not a hospital package booking', 400));
  }

  // Cancel booking
  booking.status = 'cancelled';
  booking.cancellationReason = reason;

  // Cancel all future scheduled deliveries
  await Order.updateMany({
    parentBookingId: booking._id,
    status: 'scheduled',
    deliveryTime: { $gte: new Date() }
  }, {
    status: 'cancelled',
    cancellationReason: 'Hospital booking cancelled'
  });

  await booking.save();

  // Send cancellation notifications
  try {
    const user = await User.findById(req.user.id);
    if (user && user.phone) {
      await smsService.sendSMS(
        user.phone,
        `Hospital meal package cancelled. Order #${booking.orderNumber}. Reason: ${reason}`
      );
    }

    // Notify hospital
    if (booking.hospitalDetails.hospitalInfo.contactNumber) {
      await smsService.sendSMS(
        booking.hospitalDetails.hospitalInfo.contactNumber,
        `Hospital meal package cancelled for patient ${booking.hospitalDetails.patientInfo.name}. Order #${booking.orderNumber}.`
      );
    }
  } catch (error) {
    console.error('Failed to send cancellation notification:', error);
  }

  res.status(200).json({
    success: true,
    message: 'Hospital booking cancelled successfully',
    data: booking
  });
});

// @desc    Get hospital booking analytics
// @route   GET /api/hospital/analytics
// @access  Private (Admin only)
export const getHospitalAnalytics = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { period = '30' } = req.query; // days

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period as string));

  // Get hospital booking statistics
  const bookingStats = await Order.aggregate([
    {
      $match: {
        orderType: 'hospital_package',
        parentBookingId: { $exists: false },
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$hospitalDetails.packageId',
        packageName: { $first: '$hospitalDetails.packageName' },
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        avgBookingValue: { $avg: '$totalAmount' },
        completedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    },
    {
      $sort: { totalBookings: -1 }
    }
  ]);

  // Get popular hospitals
  const hospitalStats = await Order.aggregate([
    {
      $match: {
        orderType: 'hospital_package',
        parentBookingId: { $exists: false },
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$hospitalDetails.hospitalInfo.name',
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' }
      }
    },
    {
      $sort: { totalBookings: -1 }
    },
    {
      $limit: 10
    }
  ]);

  // Get patient condition statistics
  const conditionStats = await Order.aggregate([
    {
      $match: {
        orderType: 'hospital_package',
        parentBookingId: { $exists: false },
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$hospitalDetails.patientInfo.condition',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      period: `${period} days`,
      packageStatistics: bookingStats,
      hospitalStatistics: hospitalStats,
      conditionStatistics: conditionStats,
      summary: {
        totalBookings: bookingStats.reduce((sum, stat) => sum + stat.totalBookings, 0),
        totalRevenue: bookingStats.reduce((sum, stat) => sum + stat.totalRevenue, 0),
        avgBookingValue: bookingStats.length > 0 ? 
          bookingStats.reduce((sum, stat) => sum + stat.avgBookingValue, 0) / bookingStats.length : 0,
        completionRate: bookingStats.length > 0 ?
          (bookingStats.reduce((sum, stat) => sum + stat.completedBookings, 0) / 
           bookingStats.reduce((sum, stat) => sum + stat.totalBookings, 0)) * 100 : 0
      }
    }
  });
});