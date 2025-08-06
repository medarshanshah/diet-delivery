// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_OTP: '/auth/verify-otp',
    SEND_OTP: '/auth/send-otp',
  },
  USERS: {
    PROFILE: '/users/profile',
    HEALTH_PROFILE: '/users/health-profile',
    ADDRESSES: '/users/addresses',
    PREFERENCES: '/users/preferences',
  },
  FOOD: {
    ITEMS: '/food/items',
    CATEGORIES: '/food/categories',
    SEARCH: '/food/search',
    RECOMMENDATIONS: '/food/recommendations',
  },
  ORDERS: {
    CREATE: '/orders',
    LIST: '/orders',
    DETAILS: '/orders/:id',
    CANCEL: '/orders/:id/cancel',
    TRACK: '/orders/:id/track',
  },
  SUBSCRIPTIONS: {
    PLANS: '/subscriptions/plans',
    CREATE: '/subscriptions',
    MANAGE: '/subscriptions/:id',
  },
  DIETITIANS: {
    LIST: '/dietitians',
    PROFILE: '/dietitians/:id',
    BOOK_CONSULTATION: '/dietitians/:id/book',
    CONSULTATIONS: '/consultations',
  },
  VENDORS: {
    LIST: '/vendors',
    PROFILE: '/vendors/:id',
    MENU: '/vendors/:id/menu',
  },
  PAYMENTS: {
    INITIATE: '/payments/initiate',
    VERIFY: '/payments/verify',
    METHODS: '/payments/methods',
  },
  AI: {
    MEAL_PLAN: '/ai/meal-plan',
    RECOMMENDATIONS: '/ai/recommendations',
    NUTRITION_ANALYSIS: '/ai/nutrition-analysis',
  },
  CHALLENGES: {
    LIST: '/challenges',
    JOIN: '/challenges/:id/join',
    PROGRESS: '/challenges/:id/progress',
  },
};

// Dietary preferences and restrictions
export const DIETARY_RESTRICTIONS = [
  'vegetarian',
  'vegan',
  'keto',
  'paleo',
  'gluten_free',
  'dairy_free',
  'low_carb',
  'low_sodium',
  'low_fat',
  'high_protein',
  'diabetic_friendly',
  'heart_healthy',
] as const;

export const ALLERGENS = [
  'peanuts',
  'tree_nuts',
  'milk',
  'eggs',
  'fish',
  'shellfish',
  'soy',
  'wheat',
  'sesame',
  'mustard',
] as const;

// Health conditions
export const MEDICAL_CONDITIONS = [
  'diabetes_type_1',
  'diabetes_type_2',
  'hypertension',
  'heart_disease',
  'high_cholesterol',
  'kidney_disease',
  'liver_disease',
  'thyroid_disorder',
  'celiac_disease',
  'inflammatory_bowel_disease',
  'food_allergies',
  'obesity',
  'underweight',
  'eating_disorder',
] as const;

// Activity levels for calorie calculation
export const ACTIVITY_LEVELS = {
  sedentary: { multiplier: 1.2, description: 'Little or no exercise' },
  lightly_active: { multiplier: 1.375, description: 'Light exercise 1-3 days/week' },
  moderately_active: { multiplier: 1.55, description: 'Moderate exercise 3-5 days/week' },
  very_active: { multiplier: 1.725, description: 'Hard exercise 6-7 days/week' },
  extremely_active: { multiplier: 1.9, description: 'Very hard exercise, physical job' },
} as const;

// Meal types and timing
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const DEFAULT_MEAL_TIMES = {
  breakfast: '08:00',
  lunch: '12:00',
  dinner: '19:00',
} as const;

// Nutrition guidelines (WHO/FDA recommendations)
export const NUTRITION_GUIDELINES = {
  daily_calories: {
    male: { sedentary: 2000, active: 2800 },
    female: { sedentary: 1600, active: 2200 },
  },
  macros: {
    protein: { min: 10, max: 35 }, // percentage of total calories
    carbs: { min: 45, max: 65 },
    fats: { min: 20, max: 35 },
  },
  fiber: { min: 25, max: 35 }, // grams per day
  sodium: { max: 2300 }, // mg per day
  sugar: { max: 50 }, // grams per day
} as const;

// Food categories
export const FOOD_CATEGORIES = [
  { id: 'grains', name: 'Grains & Cereals', icon: '🌾' },
  { id: 'vegetables', name: 'Vegetables', icon: '🥬' },
  { id: 'fruits', name: 'Fruits', icon: '🍎' },
  { id: 'proteins', name: 'Proteins', icon: '🥩' },
  { id: 'dairy', name: 'Dairy & Alternatives', icon: '🥛' },
  { id: 'nuts_seeds', name: 'Nuts & Seeds', icon: '🥜' },
  { id: 'beverages', name: 'Beverages', icon: '🥤' },
  { id: 'snacks', name: 'Healthy Snacks', icon: '🍪' },
  { id: 'soups', name: 'Soups & Broths', icon: '🍲' },
  { id: 'salads', name: 'Salads', icon: '🥗' },
] as const;

// Order statuses with descriptions
export const ORDER_STATUS_DESCRIPTIONS = {
  pending: 'Order received, waiting for confirmation',
  confirmed: 'Order confirmed by restaurant',
  preparing: 'Your meal is being prepared',
  ready_for_pickup: 'Order ready for pickup',
  out_for_delivery: 'On the way to you',
  delivered: 'Order delivered successfully',
  cancelled: 'Order cancelled',
  refunded: 'Order refunded',
} as const;

// Payment methods with details
export const PAYMENT_METHODS = {
  esewa: {
    name: 'eSewa',
    icon: 'esewa-icon',
    description: 'Pay with eSewa digital wallet',
    isDigital: true,
  },
  khalti: {
    name: 'Khalti',
    icon: 'khalti-icon',
    description: 'Pay with Khalti digital wallet',
    isDigital: true,
  },
  card: {
    name: 'Credit/Debit Card',
    icon: 'card-icon',
    description: 'Pay with your bank card',
    isDigital: true,
  },
  cash_on_delivery: {
    name: 'Cash on Delivery',
    icon: 'cash-icon',
    description: 'Pay when your order arrives',
    isDigital: false,
  },
} as const;

// Consultation types and durations
export const CONSULTATION_TYPES = {
  chat: { duration: 30, price: 500, description: 'Text-based consultation' },
  voice: { duration: 30, price: 800, description: 'Voice call consultation' },
  video: { duration: 45, price: 1200, description: 'Video call consultation' },
} as const;

// Health challenges
export const CHALLENGE_TYPES = {
  nutrition: 'Nutrition & Diet',
  activity: 'Physical Activity',
  hydration: 'Water Intake',
  sleep: 'Sleep Quality',
} as const;

// Vendor types
export const VENDOR_TYPES = {
  restaurant: 'Restaurant',
  cloud_kitchen: 'Cloud Kitchen',
  hospital_kitchen: 'Hospital Kitchen',
} as const;

// App configuration
export const APP_CONFIG = {
  name: 'HealthyBites',
  version: '1.0.0',
  supportEmail: 'support@healthybites.com.np',
  supportPhone: '+977-1-4444444',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'ne'],
  currency: 'NPR',
  defaultCity: 'Kathmandu',
  deliveryRadius: 20, // km
  maxOrderItems: 20,
  minOrderAmount: 100, // NPR
  maxOrderAmount: 50000, // NPR
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet.',
  UNAUTHORIZED: 'Please login to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  ORDER_NOT_FOUND: 'Order not found.',
  VENDOR_UNAVAILABLE: 'Vendor is currently unavailable.',
  ITEM_UNAVAILABLE: 'This item is currently unavailable.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  ORDER_PLACED: 'Order placed successfully!',
  PAYMENT_COMPLETED: 'Payment completed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  CONSULTATION_BOOKED: 'Consultation booked successfully!',
  SUBSCRIPTION_CREATED: 'Subscription created successfully!',
  CHALLENGE_JOINED: 'Challenge joined successfully!',
} as const;