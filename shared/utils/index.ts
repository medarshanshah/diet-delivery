import { NutritionInfo, HealthProfile, ACTIVITY_LEVELS, NUTRITION_GUIDELINES } from '../types';

// Nutrition calculation utilities
export const calculateBMR = (weight: number, height: number, age: number, gender: 'male' | 'female'): number => {
  // Mifflin-St Jeor Equation
  const baseBMR = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'male' ? baseBMR + 5 : baseBMR - 161;
};

export const calculateDailyCalories = (bmr: number, activityLevel: keyof typeof ACTIVITY_LEVELS): number => {
  return Math.round(bmr * ACTIVITY_LEVELS[activityLevel].multiplier);
};

export const calculateMacroTargets = (totalCalories: number, proteinPercent: number, carbPercent: number, fatPercent: number) => {
  return {
    protein: Math.round((totalCalories * proteinPercent / 100) / 4), // 4 calories per gram
    carbs: Math.round((totalCalories * carbPercent / 100) / 4), // 4 calories per gram
    fats: Math.round((totalCalories * fatPercent / 100) / 9), // 9 calories per gram
  };
};

export const sumNutrition = (nutritionArray: NutritionInfo[]): NutritionInfo => {
  return nutritionArray.reduce((total, nutrition) => ({
    calories: total.calories + nutrition.calories,
    protein: total.protein + nutrition.protein,
    carbohydrates: total.carbohydrates + nutrition.carbohydrates,
    fats: total.fats + nutrition.fats,
    fiber: total.fiber + nutrition.fiber,
    sugar: total.sugar + nutrition.sugar,
    sodium: total.sodium + nutrition.sodium,
    vitamins: {
      ...total.vitamins,
      ...Object.fromEntries(
        Object.entries(nutrition.vitamins || {}).map(([key, value]) => [
          key,
          (total.vitamins?.[key] || 0) + value
        ])
      )
    },
    minerals: {
      ...total.minerals,
      ...Object.fromEntries(
        Object.entries(nutrition.minerals || {}).map(([key, value]) => [
          key,
          (total.minerals?.[key] || 0) + value
        ])
      )
    }
  }), {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fats: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    vitamins: {},
    minerals: {}
  });
};

export const calculateHealthScore = (nutrition: NutritionInfo, healthProfile: HealthProfile): number => {
  const bmr = calculateBMR(healthProfile.weight, healthProfile.height, healthProfile.age, healthProfile.gender);
  const targetCalories = calculateDailyCalories(bmr, healthProfile.activityLevel);
  
  let score = 10;
  
  // Penalty for excess calories
  if (nutrition.calories > targetCalories * 1.2) score -= 2;
  
  // Penalty for too few calories
  if (nutrition.calories < targetCalories * 0.8) score -= 1;
  
  // Bonus for adequate fiber
  if (nutrition.fiber >= NUTRITION_GUIDELINES.fiber.min) score += 1;
  
  // Penalty for excess sodium
  if (nutrition.sodium > NUTRITION_GUIDELINES.sodium.max) score -= 2;
  
  // Penalty for excess sugar
  if (nutrition.sugar > NUTRITION_GUIDELINES.sugar.max) score -= 1;
  
  return Math.max(1, Math.min(10, score));
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Nepali phone number validation
  const phoneRegex = /^(\+977|977|0)?[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Date and time utilities
export const formatDate = (date: Date, locale: string = 'en-US'): string => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const formatTime = (date: Date, locale: string = 'en-US'): string => {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const formatDateTime = (date: Date, locale: string = 'en-US'): string => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isWithinDeliveryTime = (orderTime: Date, deliveryTime: Date, maxMinutes: number = 60): boolean => {
  const diffMinutes = (deliveryTime.getTime() - orderTime.getTime()) / (1000 * 60);
  return diffMinutes >= 30 && diffMinutes <= maxMinutes;
};

// Currency and formatting utilities
export const formatCurrency = (amount: number, currency: string = 'NPR'): string => {
  if (currency === 'NPR') {
    return `Rs. ${amount.toLocaleString('en-NP')}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

// Array and object utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Storage utilities
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};

export const safeJsonStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj);
  } catch {
    return '{}';
  }
};

// Health utilities
export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

export const calculateBMI = (weight: number, height: number): number => {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

export const getCalorieDeficitForWeightLoss = (currentWeight: number, targetWeight: number, weeks: number): number => {
  const weightLossKg = currentWeight - targetWeight;
  const caloriesPerKg = 7700; // approximate calories in 1kg of fat
  const totalCaloriesDeficit = weightLossKg * caloriesPerKg;
  const dailyDeficit = totalCaloriesDeficit / (weeks * 7);
  return Math.round(dailyDeficit);
};

// Location utilities
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const isWithinDeliveryRadius = (
  userLat: number,
  userLon: number,
  vendorLat: number,
  vendorLon: number,
  radiusKm: number
): boolean => {
  const distance = calculateDistance(userLat, userLon, vendorLat, vendorLon);
  return distance <= radiusKm;
};

// Error handling utilities
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const createApiError = (message: string, status: number = 500) => {
  const error = new Error(message) as any;
  error.status = status;
  return error;
};