import mongoose, { Document, Schema } from 'mongoose';

export interface INutritionInfo {
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

export interface IFoodCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  healthFocus: string[];
}

export interface IFoodItem extends Document {
  name: string;
  description: string;
  images: string[];
  category: IFoodCategory;
  nutrition: INutritionInfo;
  ingredients: string[];
  allergens: string[];
  dietaryTags: string[];
  price: number;
  discountPrice?: number;
  vendorId: mongoose.Types.ObjectId;
  isAvailable: boolean;
  preparationTime: number; // in minutes
  isDietitianApproved: boolean;
  healthScore: number; // 1-10
  servingSize: string;
  servingWeight: number; // in grams
  shelfLife?: number; // in hours
  storageInstructions?: string;
  heatingInstructions?: string;
  spiceLevel: 'none' | 'mild' | 'medium' | 'hot' | 'very_hot';
  portionSizes: Array<{
    name: string;
    weight: number; // in grams
    priceMultiplier: number;
  }>;
  customizations: Array<{
    name: string;
    options: Array<{
      name: string;
      priceChange: number;
      nutritionChange?: Partial<INutritionInfo>;
    }>;
    required: boolean;
    multiSelect: boolean;
  }>;
  nutritionVerified: boolean;
  nutritionSource: 'lab_tested' | 'calculated' | 'estimated';
  tags: string[];
  rating: number;
  reviewCount: number;
  orderCount: number;
  isFeatured: boolean;
  isOrganic: boolean;
  isGlutenFree: boolean;
  isVegan: boolean;
  isVegetarian: boolean;
  isDairyFree: boolean;
  isKeto: boolean;
  isLowCarb: boolean;
  isHighProtein: boolean;
  isLowSodium: boolean;
  createdAt: Date;
  updatedAt: Date;
  calculateHealthScore(): number;
  checkDietaryCompatibility(restrictions: string[]): boolean;
}

const nutritionInfoSchema = new Schema<INutritionInfo>({
  calories: {
    type: Number,
    required: [true, 'Calories information is required'],
    min: [0, 'Calories cannot be negative']
  },
  protein: {
    type: Number,
    required: [true, 'Protein information is required'],
    min: [0, 'Protein cannot be negative']
  },
  carbohydrates: {
    type: Number,
    required: [true, 'Carbohydrates information is required'],
    min: [0, 'Carbohydrates cannot be negative']
  },
  fats: {
    type: Number,
    required: [true, 'Fats information is required'],
    min: [0, 'Fats cannot be negative']
  },
  fiber: {
    type: Number,
    required: [true, 'Fiber information is required'],
    min: [0, 'Fiber cannot be negative']
  },
  sugar: {
    type: Number,
    required: [true, 'Sugar information is required'],
    min: [0, 'Sugar cannot be negative']
  },
  sodium: {
    type: Number,
    required: [true, 'Sodium information is required'],
    min: [0, 'Sodium cannot be negative']
  },
  vitamins: {
    type: Map,
    of: Number,
    default: new Map()
  },
  minerals: {
    type: Map,
    of: Number,
    default: new Map()
  }
});

const foodCategorySchema = new Schema<IFoodCategory>({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  healthFocus: [String]
});

const foodItemSchema = new Schema<IFoodItem>({
  name: {
    type: String,
    required: [true, 'Food item name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  images: [{
    type: String,
    required: true
  }],
  category: {
    type: foodCategorySchema,
    required: [true, 'Category is required']
  },
  nutrition: {
    type: nutritionInfoSchema,
    required: [true, 'Nutrition information is required']
  },
  ingredients: [{
    type: String,
    required: true,
    trim: true
  }],
  allergens: [{
    type: String,
    enum: ['peanuts', 'tree_nuts', 'milk', 'eggs', 'fish', 'shellfish', 'soy', 'wheat', 'sesame', 'mustard']
  }],
  dietaryTags: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'keto', 'paleo', 'gluten_free', 'dairy_free', 'low_carb', 'low_sodium', 'high_protein', 'diabetic_friendly', 'heart_healthy']
  }],
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative']
  },
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Vendor ID is required']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number,
    required: [true, 'Preparation time is required'],
    min: [1, 'Preparation time must be at least 1 minute'],
    max: [120, 'Preparation time cannot exceed 120 minutes']
  },
  isDietitianApproved: {
    type: Boolean,
    default: false
  },
  healthScore: {
    type: Number,
    min: [1, 'Health score must be at least 1'],
    max: [10, 'Health score cannot exceed 10'],
    default: 5
  },
  servingSize: {
    type: String,
    required: [true, 'Serving size is required'],
    trim: true
  },
  servingWeight: {
    type: Number,
    required: [true, 'Serving weight is required'],
    min: [1, 'Serving weight must be at least 1 gram']
  },
  shelfLife: {
    type: Number,
    min: [1, 'Shelf life must be at least 1 hour']
  },
  storageInstructions: {
    type: String,
    trim: true
  },
  heatingInstructions: {
    type: String,
    trim: true
  },
  spiceLevel: {
    type: String,
    enum: ['none', 'mild', 'medium', 'hot', 'very_hot'],
    default: 'none'
  },
  portionSizes: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    weight: {
      type: Number,
      required: true,
      min: [1, 'Portion weight must be at least 1 gram']
    },
    priceMultiplier: {
      type: Number,
      required: true,
      min: [0.1, 'Price multiplier must be at least 0.1']
    }
  }],
  customizations: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    options: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      priceChange: {
        type: Number,
        default: 0
      },
      nutritionChange: nutritionInfoSchema
    }],
    required: {
      type: Boolean,
      default: false
    },
    multiSelect: {
      type: Boolean,
      default: false
    }
  }],
  nutritionVerified: {
    type: Boolean,
    default: false
  },
  nutritionSource: {
    type: String,
    enum: ['lab_tested', 'calculated', 'estimated'],
    default: 'estimated'
  },
  tags: [{
    type: String,
    trim: true
  }],
  rating: {
    type: Number,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5'],
    default: 0
  },
  reviewCount: {
    type: Number,
    min: [0, 'Review count cannot be negative'],
    default: 0
  },
  orderCount: {
    type: Number,
    min: [0, 'Order count cannot be negative'],
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isOrganic: {
    type: Boolean,
    default: false
  },
  isGlutenFree: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isDairyFree: {
    type: Boolean,
    default: false
  },
  isKeto: {
    type: Boolean,
    default: false
  },
  isLowCarb: {
    type: Boolean,
    default: false
  },
  isHighProtein: {
    type: Boolean,
    default: false
  },
  isLowSodium: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for effective price (considering discount)
foodItemSchema.virtual('effectivePrice').get(function() {
  return this.discountPrice && this.discountPrice < this.price ? this.discountPrice : this.price;
});

// Virtual for discount percentage
foodItemSchema.virtual('discountPercentage').get(function() {
  if (this.discountPrice && this.discountPrice < this.price) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

// Calculate health score based on nutrition
foodItemSchema.methods.calculateHealthScore = function(): number {
  let score = 5; // Base score
  
  const nutrition = this.nutrition;
  const weight = this.servingWeight;
  
  // Protein bonus (good for health)
  const proteinPer100g = (nutrition.protein / weight) * 100;
  if (proteinPer100g >= 20) score += 2;
  else if (proteinPer100g >= 10) score += 1;
  
  // Fiber bonus
  const fiberPer100g = (nutrition.fiber / weight) * 100;
  if (fiberPer100g >= 10) score += 1;
  else if (fiberPer100g >= 5) score += 0.5;
  
  // Sugar penalty
  const sugarPer100g = (nutrition.sugar / weight) * 100;
  if (sugarPer100g >= 20) score -= 2;
  else if (sugarPer100g >= 10) score -= 1;
  
  // Sodium penalty
  const sodiumPer100g = (nutrition.sodium / weight) * 100;
  if (sodiumPer100g >= 600) score -= 2; // High sodium
  else if (sodiumPer100g >= 300) score -= 1; // Moderate sodium
  
  // Calorie density consideration
  const caloriesPer100g = (nutrition.calories / weight) * 100;
  if (caloriesPer100g >= 400) score -= 1; // High calorie density
  
  // Dietary tag bonuses
  if (this.isOrganic) score += 0.5;
  if (this.isVegan || this.isVegetarian) score += 0.5;
  if (this.isGlutenFree && this.allergens.includes('wheat')) score += 0.5;
  
  return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
};

// Check dietary compatibility
foodItemSchema.methods.checkDietaryCompatibility = function(restrictions: string[]): boolean {
  for (const restriction of restrictions) {
    switch (restriction) {
      case 'vegetarian':
        if (!this.isVegetarian) return false;
        break;
      case 'vegan':
        if (!this.isVegan) return false;
        break;
      case 'gluten_free':
        if (!this.isGlutenFree || this.allergens.includes('wheat')) return false;
        break;
      case 'dairy_free':
        if (!this.isDairyFree || this.allergens.includes('milk')) return false;
        break;
      case 'keto':
        if (!this.isKeto) return false;
        break;
      case 'low_carb':
        if (!this.isLowCarb) return false;
        break;
      case 'low_sodium':
        if (!this.isLowSodium) return false;
        break;
      case 'high_protein':
        if (!this.isHighProtein) return false;
        break;
    }
  }
  return true;
};

// Pre-save middleware to automatically set dietary flags
foodItemSchema.pre('save', function(next) {
  // Auto-set dietary flags based on ingredients and allergens
  const ingredients = this.ingredients.map(i => i.toLowerCase());
  const allergens = this.allergens;
  
  // Check if vegetarian (no meat/fish)
  const meatKeywords = ['chicken', 'beef', 'pork', 'fish', 'mutton', 'lamb', 'meat'];
  this.isVegetarian = !meatKeywords.some(keyword => 
    ingredients.some(ingredient => ingredient.includes(keyword))
  );
  
  // Check if vegan (no animal products)
  const animalProducts = ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg', 'honey'];
  this.isVegan = this.isVegetarian && !animalProducts.some(product => 
    ingredients.some(ingredient => ingredient.includes(product))
  ) && !allergens.includes('milk') && !allergens.includes('eggs');
  
  // Auto-set gluten free
  this.isGlutenFree = !allergens.includes('wheat') && 
    !ingredients.some(ingredient => 
      ['wheat', 'barley', 'rye', 'gluten'].some(grain => ingredient.includes(grain))
    );
  
  // Auto-set dairy free
  this.isDairyFree = !allergens.includes('milk') && 
    !ingredients.some(ingredient => 
      ['milk', 'cheese', 'butter', 'cream', 'yogurt'].some(dairy => ingredient.includes(dairy))
    );
  
  // Calculate health score
  this.healthScore = this.calculateHealthScore();
  
  next();
});

// Indexes for better performance
foodItemSchema.index({ vendorId: 1 });
foodItemSchema.index({ 'category.id': 1 });
foodItemSchema.index({ dietaryTags: 1 });
foodItemSchema.index({ isAvailable: 1 });
foodItemSchema.index({ isDietitianApproved: 1 });
foodItemSchema.index({ healthScore: -1 });
foodItemSchema.index({ rating: -1 });
foodItemSchema.index({ price: 1 });
foodItemSchema.index({ isFeatured: 1 });
foodItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.model<IFoodItem>('FoodItem', foodItemSchema);