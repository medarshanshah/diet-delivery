import mongoose, { Document, Schema } from 'mongoose';

export interface IHealthGoal {
  type: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'maintenance' | 'diabetes_management' | 'heart_health';
  targetWeight?: number;
  targetDate?: Date;
  isActive: boolean;
}

export interface IMedicalCondition {
  condition: string;
  severity: 'mild' | 'moderate' | 'severe';
  medications?: string[];
  diagnosedDate?: Date;
  notes?: string;
}

export interface IDietaryRestriction {
  type: 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'gluten_free' | 'dairy_free' | 'low_carb' | 'low_sodium';
  strictness: 'strict' | 'flexible';
  reason?: string;
}

export interface IMacroTargets {
  protein: number; // percentage
  carbs: number; // percentage
  fats: number; // percentage
}

export interface IHealthProfile extends Document {
  userId: mongoose.Types.ObjectId;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // in cm
  weight: number; // in kg
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  healthGoals: IHealthGoal[];
  medicalConditions: IMedicalCondition[];
  allergies: string[];
  dietaryRestrictions: IDietaryRestriction[];
  dailyCalorieGoal?: number;
  macroTargets?: IMacroTargets;
  bmr?: number; // Basal Metabolic Rate
  bmi?: number; // Body Mass Index
  targetWaterIntake?: number; // in ml
  sleepGoal?: number; // in hours
  exerciseGoal?: number; // minutes per week
  lastWeightUpdate?: Date;
  weightHistory: Array<{
    weight: number;
    date: Date;
    notes?: string;
  }>;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: Date;
  updatedAt: Date;
  calculateBMR(): number;
  calculateBMI(): number;
  calculateDailyCalories(): number;
}

const healthGoalSchema = new Schema<IHealthGoal>({
  type: {
    type: String,
    enum: ['weight_loss', 'weight_gain', 'muscle_gain', 'maintenance', 'diabetes_management', 'heart_health'],
    required: true
  },
  targetWeight: {
    type: Number,
    min: [30, 'Target weight must be at least 30kg'],
    max: [300, 'Target weight must be less than 300kg']
  },
  targetDate: Date,
  isActive: {
    type: Boolean,
    default: true
  }
});

const medicalConditionSchema = new Schema<IMedicalCondition>({
  condition: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe'],
    required: true
  },
  medications: [String],
  diagnosedDate: Date,
  notes: String
});

const dietaryRestrictionSchema = new Schema<IDietaryRestriction>({
  type: {
    type: String,
    enum: ['vegetarian', 'vegan', 'keto', 'paleo', 'gluten_free', 'dairy_free', 'low_carb', 'low_sodium'],
    required: true
  },
  strictness: {
    type: String,
    enum: ['strict', 'flexible'],
    default: 'strict'
  },
  reason: String
});

const macroTargetsSchema = new Schema<IMacroTargets>({
  protein: {
    type: Number,
    min: [10, 'Protein percentage must be at least 10%'],
    max: [40, 'Protein percentage must be less than 40%'],
    required: true
  },
  carbs: {
    type: Number,
    min: [30, 'Carbs percentage must be at least 30%'],
    max: [70, 'Carbs percentage must be less than 70%'],
    required: true
  },
  fats: {
    type: Number,
    min: [15, 'Fats percentage must be at least 15%'],
    max: [40, 'Fats percentage must be less than 40%'],
    required: true
  }
});

const healthProfileSchema = new Schema<IHealthProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [13, 'Age must be at least 13'],
    max: [120, 'Age must be less than 120']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },
  height: {
    type: Number,
    required: [true, 'Height is required'],
    min: [100, 'Height must be at least 100cm'],
    max: [250, 'Height must be less than 250cm']
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [30, 'Weight must be at least 30kg'],
    max: [300, 'Weight must be less than 300kg']
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'],
    required: [true, 'Activity level is required'],
    default: 'moderately_active'
  },
  healthGoals: [healthGoalSchema],
  medicalConditions: [medicalConditionSchema],
  allergies: [{
    type: String,
    trim: true
  }],
  dietaryRestrictions: [dietaryRestrictionSchema],
  dailyCalorieGoal: {
    type: Number,
    min: [1000, 'Daily calorie goal must be at least 1000'],
    max: [5000, 'Daily calorie goal must be less than 5000']
  },
  macroTargets: macroTargetsSchema,
  bmr: Number,
  bmi: Number,
  targetWaterIntake: {
    type: Number,
    default: 2000, // 2 liters
    min: [1000, 'Water intake must be at least 1000ml'],
    max: [5000, 'Water intake must be less than 5000ml']
  },
  sleepGoal: {
    type: Number,
    default: 8,
    min: [4, 'Sleep goal must be at least 4 hours'],
    max: [12, 'Sleep goal must be less than 12 hours']
  },
  exerciseGoal: {
    type: Number,
    default: 150, // WHO recommendation: 150 minutes per week
    min: [0, 'Exercise goal cannot be negative'],
    max: [1000, 'Exercise goal must be less than 1000 minutes per week']
  },
  lastWeightUpdate: Date,
  weightHistory: [{
    weight: {
      type: Number,
      required: true,
      min: [30, 'Weight must be at least 30kg'],
      max: [300, 'Weight must be less than 300kg']
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate BMR using Mifflin-St Jeor Equation
healthProfileSchema.methods.calculateBMR = function(): number {
  const baseBMR = 10 * this.weight + 6.25 * this.height - 5 * this.age;
  return this.gender === 'male' ? baseBMR + 5 : baseBMR - 161;
};

// Calculate BMI
healthProfileSchema.methods.calculateBMI = function(): number {
  const heightInMeters = this.height / 100;
  return this.weight / (heightInMeters * heightInMeters);
};

// Calculate daily calories based on activity level
healthProfileSchema.methods.calculateDailyCalories = function(): number {
  const bmr = this.calculateBMR();
  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9
  };
  
  return Math.round(bmr * activityMultipliers[this.activityLevel]);
};

// Pre-save middleware to calculate BMR, BMI, and calories
healthProfileSchema.pre('save', function(next) {
  this.bmr = this.calculateBMR();
  this.bmi = this.calculateBMI();
  
  if (!this.dailyCalorieGoal) {
    this.dailyCalorieGoal = this.calculateDailyCalories();
  }
  
  // Update weight history if weight changed
  if (this.isModified('weight') && !this.isNew) {
    this.weightHistory.push({
      weight: this.weight,
      date: new Date(),
      notes: 'Weight updated'
    });
    this.lastWeightUpdate = new Date();
  }
  
  next();
});

// Validate macro targets sum to 100%
healthProfileSchema.pre('save', function(next) {
  if (this.macroTargets) {
    const sum = this.macroTargets.protein + this.macroTargets.carbs + this.macroTargets.fats;
    if (Math.abs(sum - 100) > 1) { // Allow 1% tolerance
      return next(new Error('Macro targets must sum to 100%'));
    }
  }
  next();
});

// Indexes
healthProfileSchema.index({ userId: 1 });
healthProfileSchema.index({ 'healthGoals.type': 1 });
healthProfileSchema.index({ 'medicalConditions.condition': 1 });
healthProfileSchema.index({ 'dietaryRestrictions.type': 1 });

export default mongoose.model<IHealthProfile>('HealthProfile', healthProfileSchema);