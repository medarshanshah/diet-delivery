import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  foodItemId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  customizations: Array<{
    name: string;
    options: string[];
    priceChange: number;
  }>;
  nutritionTotal: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fats: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  portionSize?: string;
  specialInstructions?: string;
}

export interface ISubscriptionDetails {
  type: 'daily' | 'weekly' | 'monthly';
  duration: number; // in days
  mealsPerDay: number;
  startDate: Date;
  endDate: Date;
  deliveryTimes: string[]; // e.g., ['08:00', '12:00', '19:00']
  isActive: boolean;
  pausedDates?: Date[];
  nextDeliveryDate?: Date;
  remainingDeliveries?: number;
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  landmark?: string;
  isDefault: boolean;
  type: 'home' | 'office' | 'hospital' | 'other';
}

export interface IPaymentInfo {
  method: 'esewa' | 'khalti' | 'card' | 'cash_on_delivery';
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount: number;
  paymentDate?: Date;
  failureReason?: string;
  refundAmount?: number;
  refundDate?: Date;
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

export interface IOrder extends Document {
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  orderType: 'single' | 'subscription' | 'hospital_package';
  subscriptionDetails?: ISubscriptionDetails;
  deliveryAddress: IAddress;
  deliveryTime: Date;
  requestedDeliveryTime?: Date;
  specialInstructions?: string;
  status: OrderStatus;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: Date;
    notes?: string;
    updatedBy?: mongoose.Types.ObjectId;
  }>;
  payment: IPaymentInfo;
  pricing: {
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    tax: number;
    discount: number;
    totalAmount: number;
  };
  deliveryPersonId?: mongoose.Types.ObjectId;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  dietitianNotes?: string;
  customerRating?: {
    food: number; // 1-5
    delivery: number; // 1-5
    overall: number; // 1-5
    review?: string;
    ratedAt: Date;
  };
  isGift: boolean;
  giftMessage?: string;
  isHospitalOrder: boolean;
  hospitalDetails?: {
    patientName: string;
    roomNumber: string;
    department: string;
    contactPerson: string;
    contactPhone: string;
    dietaryRestrictions?: string[];
    mealPlan?: string;
  };
  loyaltyPointsEarned?: number;
  loyaltyPointsUsed?: number;
  promoCode?: string;
  promoDiscount?: number;
  cancellationReason?: string;
  refundDetails?: {
    amount: number;
    reason: string;
    processedAt: Date;
    processedBy: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
  calculateTotalNutrition(): any;
  canBeCancelled(): boolean;
  canBeModified(): boolean;
}

const orderItemSchema = new Schema<IOrderItem>({
  foodItemId: {
    type: Schema.Types.ObjectId,
    ref: 'FoodItem',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  customizations: [{
    name: {
      type: String,
      required: true
    },
    options: [String],
    priceChange: {
      type: Number,
      default: 0
    }
  }],
  nutritionTotal: {
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbohydrates: { type: Number, required: true },
    fats: { type: Number, required: true },
    fiber: { type: Number, required: true },
    sugar: { type: Number, required: true },
    sodium: { type: Number, required: true }
  },
  portionSize: String,
  specialInstructions: String
});

const subscriptionDetailsSchema = new Schema<ISubscriptionDetails>({
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: [1, 'Duration must be at least 1 day']
  },
  mealsPerDay: {
    type: Number,
    required: true,
    min: [1, 'Meals per day must be at least 1'],
    max: [5, 'Meals per day cannot exceed 5']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  deliveryTimes: [{
    type: String,
    required: true,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  pausedDates: [Date],
  nextDeliveryDate: Date,
  remainingDeliveries: {
    type: Number,
    min: [0, 'Remaining deliveries cannot be negative']
  }
});

const addressSchema = new Schema<IAddress>({
  street: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  zipCode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true,
    default: 'Nepal'
  },
  coordinates: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  landmark: String,
  isDefault: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['home', 'office', 'hospital', 'other'],
    default: 'home'
  }
});

const paymentInfoSchema = new Schema<IPaymentInfo>({
  method: {
    type: String,
    enum: ['esewa', 'khalti', 'card', 'cash_on_delivery'],
    required: true
  },
  transactionId: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Payment amount cannot be negative']
  },
  paymentDate: Date,
  failureReason: String,
  refundAmount: {
    type: Number,
    min: [0, 'Refund amount cannot be negative']
  },
  refundDate: Date
});

const orderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: function(items: IOrderItem[]) {
        return items.length > 0;
      },
      message: 'Order must have at least one item'
    }
  },
  orderType: {
    type: String,
    enum: ['single', 'subscription', 'hospital_package'],
    default: 'single'
  },
  subscriptionDetails: subscriptionDetailsSchema,
  deliveryAddress: {
    type: addressSchema,
    required: true
  },
  deliveryTime: {
    type: Date,
    required: true
  },
  requestedDeliveryTime: Date,
  specialInstructions: {
    type: String,
    maxlength: [500, 'Special instructions cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String,
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  payment: {
    type: paymentInfoSchema,
    required: true
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative']
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: [0, 'Delivery fee cannot be negative']
    },
    serviceFee: {
      type: Number,
      default: 0,
      min: [0, 'Service fee cannot be negative']
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative']
    }
  },
  deliveryPersonId: {
    type: Schema.Types.ObjectId,
    ref: 'DeliveryPerson'
  },
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  dietitianNotes: {
    type: String,
    maxlength: [1000, 'Dietitian notes cannot exceed 1000 characters']
  },
  customerRating: {
    food: {
      type: Number,
      min: [1, 'Food rating must be between 1 and 5'],
      max: [5, 'Food rating must be between 1 and 5']
    },
    delivery: {
      type: Number,
      min: [1, 'Delivery rating must be between 1 and 5'],
      max: [5, 'Delivery rating must be between 1 and 5']
    },
    overall: {
      type: Number,
      min: [1, 'Overall rating must be between 1 and 5'],
      max: [5, 'Overall rating must be between 1 and 5']
    },
    review: {
      type: String,
      maxlength: [500, 'Review cannot exceed 500 characters']
    },
    ratedAt: Date
  },
  isGift: {
    type: Boolean,
    default: false
  },
  giftMessage: {
    type: String,
    maxlength: [200, 'Gift message cannot exceed 200 characters']
  },
  isHospitalOrder: {
    type: Boolean,
    default: false
  },
  hospitalDetails: {
    patientName: String,
    roomNumber: String,
    department: String,
    contactPerson: String,
    contactPhone: String,
    dietaryRestrictions: [String],
    mealPlan: String
  },
  loyaltyPointsEarned: {
    type: Number,
    default: 0,
    min: [0, 'Loyalty points earned cannot be negative']
  },
  loyaltyPointsUsed: {
    type: Number,
    default: 0,
    min: [0, 'Loyalty points used cannot be negative']
  },
  promoCode: String,
  promoDiscount: {
    type: Number,
    default: 0,
    min: [0, 'Promo discount cannot be negative']
  },
  cancellationReason: String,
  refundDetails: {
    amount: {
      type: Number,
      min: [0, 'Refund amount cannot be negative']
    },
    reason: String,
    processedAt: Date,
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.orderNumber = `HB${timestamp}${random}`;
  }
  next();
});

// Add status to history when status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      notes: `Status changed to ${this.status}`
    });
  }
  next();
});

// Calculate total nutrition for the order
orderSchema.methods.calculateTotalNutrition = function() {
  return this.items.reduce((total: any, item: IOrderItem) => {
    return {
      calories: total.calories + item.nutritionTotal.calories,
      protein: total.protein + item.nutritionTotal.protein,
      carbohydrates: total.carbohydrates + item.nutritionTotal.carbohydrates,
      fats: total.fats + item.nutritionTotal.fats,
      fiber: total.fiber + item.nutritionTotal.fiber,
      sugar: total.sugar + item.nutritionTotal.sugar,
      sodium: total.sodium + item.nutritionTotal.sodium
    };
  }, {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fats: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  });
};

// Check if order can be cancelled
orderSchema.methods.canBeCancelled = function(): boolean {
  const cancellableStatuses: OrderStatus[] = ['pending', 'confirmed'];
  return cancellableStatuses.includes(this.status);
};

// Check if order can be modified
orderSchema.methods.canBeModified = function(): boolean {
  const modifiableStatuses: OrderStatus[] = ['pending'];
  return modifiableStatuses.includes(this.status);
};

// Indexes for better performance
orderSchema.index({ userId: 1 });
orderSchema.index({ vendorId: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ deliveryTime: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ deliveryPersonId: 1 });
orderSchema.index({ orderType: 1 });

export default mongoose.model<IOrder>('Order', orderSchema);