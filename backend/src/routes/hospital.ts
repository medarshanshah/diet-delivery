import express from 'express';
import {
  getHospitalPackages,
  createHospitalBooking,
  getHospitalBookings,
  getHospitalBooking,
  modifyHospitalBooking,
  cancelHospitalBooking,
  getHospitalAnalytics
} from '../controllers/hospitalController';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { body } from 'express-validator';

const router = express.Router();

// Validation middleware
const hospitalBookingValidation = [
  body('packageId').isIn([
    'patient_recovery', 'diabetic_care', 'cardiac_care', 
    'maternity_care', 'family_support', 'emergency_support'
  ]).withMessage('Invalid package ID'),
  
  body('hospitalInfo.name').notEmpty().withMessage('Hospital name is required'),
  body('hospitalInfo.address').notEmpty().withMessage('Hospital address is required'),
  body('hospitalInfo.ward').notEmpty().withMessage('Ward information is required'),
  body('hospitalInfo.roomNumber').notEmpty().withMessage('Room number is required'),
  body('hospitalInfo.contactNumber').isMobilePhone('ne-NP').withMessage('Valid hospital contact number is required'),
  
  body('patientInfo.name').notEmpty().withMessage('Patient name is required'),
  body('patientInfo.age').isInt({ min: 0, max: 120 }).withMessage('Valid patient age is required'),
  body('patientInfo.condition').notEmpty().withMessage('Patient condition is required'),
  body('patientInfo.admissionDate').isISO8601().withMessage('Valid admission date is required'),
  body('patientInfo.doctorName').notEmpty().withMessage('Doctor name is required'),
  
  body('emergencyContact.name').notEmpty().withMessage('Emergency contact name is required'),
  body('emergencyContact.relationship').notEmpty().withMessage('Emergency contact relationship is required'),
  body('emergencyContact.phone').isMobilePhone('ne-NP').withMessage('Valid emergency contact phone is required'),
  
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('duration').optional().isInt({ min: 1, max: 30 }).withMessage('Duration must be between 1 and 30 days'),
  body('mealsPerDay').optional().isInt({ min: 1, max: 5 }).withMessage('Meals per day must be between 1 and 5'),
  
  body('deliveryAddress.street').notEmpty().withMessage('Delivery street address is required'),
  body('deliveryAddress.city').notEmpty().withMessage('Delivery city is required'),
  
  body('paymentMethod').notEmpty().withMessage('Payment method is required')
];

const modifyBookingValidation = [
  body('dietaryModifications').optional().isArray().withMessage('Dietary modifications must be an array'),
  body('specialInstructions').optional().isString().isLength({ max: 500 }).withMessage('Special instructions cannot exceed 500 characters'),
  body('emergencyContact.name').optional().notEmpty().withMessage('Emergency contact name cannot be empty'),
  body('emergencyContact.relationship').optional().notEmpty().withMessage('Emergency contact relationship cannot be empty'),
  body('emergencyContact.phone').optional().isMobilePhone('ne-NP').withMessage('Valid emergency contact phone is required')
];

// ========== PUBLIC ROUTES ==========

// @route   GET /api/hospital/packages
// @desc    Get available hospital packages
// @access  Public
router.get('/packages', getHospitalPackages);

// ========== PROTECTED ROUTES ==========

// @route   POST /api/hospital/book
// @desc    Create hospital package booking
// @access  Private
router.post('/book', protect, hospitalBookingValidation, validate, createHospitalBooking);

// @route   GET /api/hospital/bookings
// @desc    Get user's hospital bookings
// @access  Private
router.get('/bookings', protect, getHospitalBookings);

// @route   GET /api/hospital/bookings/:id
// @desc    Get single hospital booking
// @access  Private
router.get('/bookings/:id', protect, getHospitalBooking);

// @route   PUT /api/hospital/bookings/:id
// @desc    Modify hospital booking
// @access  Private
router.put('/bookings/:id', protect, modifyBookingValidation, validate, modifyHospitalBooking);

// @route   DELETE /api/hospital/bookings/:id
// @desc    Cancel hospital booking
// @access  Private
router.delete('/bookings/:id', protect, cancelHospitalBooking);

// ========== ADMIN ROUTES ==========

// @route   GET /api/hospital/analytics
// @desc    Get hospital booking analytics
// @access  Private (Admin only)
router.get('/analytics', protect, authorize('admin'), getHospitalAnalytics);

export default router;