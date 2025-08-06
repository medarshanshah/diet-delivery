// User related types
export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  avatar?: string;
  role: 'customer' | 'dietitian' | 'vendor' | 'admin';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthProfile {
  id: string;
  userId: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // in cm
  weight: number; // in kg
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  healthGoals: HealthGoal[];
  medicalConditions: MedicalCondition[];
  allergies: string[];
  dietaryRestrictions: DietaryRestriction[];
  dailyCalorieGoal?: number;
  macroTargets?: MacroTargets;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthGoal {
  type: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'maintenance' | 'diabetes_management' | 'heart_health';
  targetWeight?: number;
  targetDate?: Date;
  isActive: boolean;
}

export interface MedicalCondition {
  condition: string;
  severity: 'mild' | 'moderate' | 'severe';
  medications?: string[];
}

export interface DietaryRestriction {
  type: 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'gluten_free' | 'dairy_free' | 'low_carb' | 'low_sodium';
  strictness: 'strict' | 'flexible';
}

export interface MacroTargets {
  protein: number; // percentage
  carbs: number; // percentage
  fats: number; // percentage
}

// Food and Menu related types
export interface FoodItem {
  id: string;
  name: string;
  description: string;
  images: string[];
  category: FoodCategory;
  nutrition: NutritionInfo;
  ingredients: string[];
  allergens: string[];
  dietaryTags: string[];
  price: number;
  vendorId: string;
  isAvailable: boolean;
  preparationTime: number; // in minutes
  isDietitianApproved: boolean;
  healthScore: number; // 1-10
  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionInfo {
  calories: number;
  protein: number; // in grams
  carbohydrates: number; // in grams
  fats: number; // in grams
  fiber: number; // in grams
  sugar: number; // in grams
  sodium: number; // in mg
  vitamins?: { [key: string]: number };
  minerals?: { [key: string]: number };
}

export interface FoodCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  healthFocus: string[];
}

// Order related types
export interface Order {
  id: string;
  userId: string;
  vendorId: string;
  items: OrderItem[];
  orderType: 'single' | 'subscription' | 'hospital_package';
  subscriptionDetails?: SubscriptionDetails;
  deliveryAddress: Address;
  deliveryTime: Date;
  specialInstructions?: string;
  status: OrderStatus;
  payment: PaymentInfo;
  totalAmount: number;
  deliveryFee: number;
  discount: number;
  dietitianNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  foodItemId: string;
  quantity: number;
  customizations: string[];
  price: number;
  nutritionTotal: NutritionInfo;
}

export interface SubscriptionDetails {
  type: 'daily' | 'weekly' | 'monthly';
  duration: number; // in days
  mealsPerDay: number;
  startDate: Date;
  endDate: Date;
  deliveryTimes: string[]; // e.g., ['08:00', '12:00', '19:00']
  isActive: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isDefault: boolean;
  type: 'home' | 'office' | 'hospital' | 'other';
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface PaymentInfo {
  method: 'esewa' | 'khalti' | 'card' | 'cash_on_delivery';
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount: number;
}

// Dietitian and Consultation types
export interface Dietitian {
  id: string;
  userId: string;
  license: string;
  experience: number; // in years
  specializations: string[];
  rating: number;
  consultationFee: number;
  isAvailable: boolean;
  availableSlots: TimeSlot[];
  languages: string[];
  bio: string;
  education: string[];
  certifications: string[];
}

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface Consultation {
  id: string;
  userId: string;
  dietitianId: string;
  type: 'chat' | 'voice' | 'video';
  scheduledTime: Date;
  duration: number; // in minutes
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  notes: string;
  recommendations: MealRecommendation[];
  followUpDate?: Date;
  fee: number;
  createdAt: Date;
}

export interface MealRecommendation {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodItems: string[]; // food item IDs
  portions: number[];
  notes: string;
  nutritionGoals: NutritionInfo;
}

// Vendor related types
export interface Vendor {
  id: string;
  name: string;
  description: string;
  logo: string;
  images: string[];
  address: Address;
  phone: string;
  email: string;
  type: 'restaurant' | 'cloud_kitchen' | 'hospital_kitchen';
  cuisineTypes: string[];
  rating: number;
  isVerified: boolean;
  isDietitianPartner: boolean;
  operatingHours: OperatingHours;
  deliveryRadius: number; // in km
  minimumOrder: number;
  deliveryFee: number;
  preparationTime: number; // average in minutes
  healthCertificates: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OperatingHours {
  [key: string]: {
    open: string;
    close: string;
    isOpen: boolean;
  };
}

// AI and Analytics types
export interface MealPlan {
  id: string;
  userId: string;
  dietitianId?: string;
  type: 'ai_generated' | 'dietitian_created' | 'user_custom';
  duration: number; // in days
  dailyMeals: DailyMeal[];
  totalNutrition: NutritionInfo;
  healthGoalAlignment: number; // 1-10 score
  estimatedCost: number;
  isActive: boolean;
  createdAt: Date;
}

export interface DailyMeal {
  day: number;
  breakfast: MealRecommendation;
  lunch: MealRecommendation;
  dinner: MealRecommendation;
  snacks: MealRecommendation[];
  totalNutrition: NutritionInfo;
  totalCost: number;
}

export interface HealthChallenge {
  id: string;
  title: string;
  description: string;
  type: 'nutrition' | 'activity' | 'hydration' | 'sleep';
  duration: number; // in days
  goal: string;
  rewards: ChallengeReward[];
  participants: string[]; // user IDs
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface ChallengeReward {
  type: 'badge' | 'discount' | 'points' | 'free_consultation';
  value: string | number;
  description: string;
}

// Delivery and Tracking types
export interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'bike' | 'scooter' | 'car';
  vehicleNumber: string;
  rating: number;
  isAvailable: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface DeliveryTracking {
  orderId: string;
  deliveryPersonId: string;
  status: OrderStatus;
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  route: {
    latitude: number;
    longitude: number;
  }[];
  updates: DeliveryUpdate[];
}

export interface DeliveryUpdate {
  timestamp: Date;
  status: OrderStatus;
  location: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

// Common utility types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SearchFilters {
  category?: string;
  priceRange?: [number, number];
  dietaryTags?: string[];
  maxCalories?: number;
  minProtein?: number;
  rating?: number;
  deliveryTime?: number;
  isDietitianApproved?: boolean;
  vendorId?: string;
}