import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  User,
  Heart,
  Scale,
  Target,
  Activity,
  AlertTriangle,
  Apple,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  TrendingUp
} from 'lucide-react';

// Validation schema
const healthProfileSchema = z.object({
  age: z.number().min(13).max(120),
  gender: z.enum(['male', 'female', 'other']),
  height: z.number().min(50).max(250),
  weight: z.number().min(20).max(300),
  activityLevel: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']),
  healthGoals: z.array(z.object({
    goal: z.enum(['weight_loss', 'weight_gain', 'muscle_gain', 'maintain_weight', 'improve_health', 'manage_diabetes', 'manage_hypertension', 'heart_health', 'digestive_health']),
    targetValue: z.number().optional(),
    targetDate: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional()
  })).min(1),
  medicalConditions: z.array(z.object({
    condition: z.enum(['diabetes_type1', 'diabetes_type2', 'hypertension', 'heart_disease', 'kidney_disease', 'liver_disease', 'thyroid_disorder', 'pcod_pcos', 'pregnancy', 'breastfeeding', 'post_surgery']),
    severity: z.enum(['mild', 'moderate', 'severe']).optional(),
    diagnosed: z.string().optional(),
    notes: z.string().optional()
  })).optional(),
  allergies: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.object({
    type: z.enum(['vegetarian', 'vegan', 'keto', 'paleo', 'gluten_free', 'dairy_free', 'low_carb', 'low_sodium']),
    severity: z.enum(['mild', 'moderate', 'severe']).optional(),
    notes: z.string().optional()
  })).optional()
});

type HealthProfileFormData = z.infer<typeof healthProfileSchema>;

const HealthProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<HealthProfileFormData>({
    resolver: zodResolver(healthProfileSchema),
    defaultValues: {
      healthGoals: [{ goal: 'improve_health', priority: 'high' }],
      medicalConditions: [],
      allergies: [],
      dietaryRestrictions: []
    }
  });

  const watchedValues = watch();

  // Load existing health profile
  useEffect(() => {
    const loadHealthProfile = async () => {
      try {
        const { healthProfileService } = await import('../../services/healthProfileService');
        const profileData = await healthProfileService.getHealthProfile();
        setExistingProfile(profileData);
        setIsEditing(true);
        reset(profileData);
      } catch (error) {
        console.error('Error loading health profile:', error);
        // Profile doesn't exist, user can create a new one
      }
    };

    loadHealthProfile();
  }, [reset]);

  const onSubmit = async (data: HealthProfileFormData) => {
    setLoading(true);
    try {
      const { healthProfileService } = await import('../../services/healthProfileService');
      
      if (isEditing) {
        await healthProfileService.updateHealthProfile(data);
        toast.success('Health profile updated successfully!');
      } else {
        await healthProfileService.createHealthProfile(data);
        toast.success('Health profile created successfully!');
      }
      
      navigate('/profile');
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = () => {
    const height = watchedValues.height;
    const weight = watchedValues.weight;
    if (height && weight) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: string) => {
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
    if (bmiValue < 25) return { category: 'Normal', color: 'text-green-600' };
    if (bmiValue < 30) return { category: 'Overweight', color: 'text-yellow-600' };
    return { category: 'Obese', color: 'text-red-600' };
  };

  const addHealthGoal = () => {
    const currentGoals = watchedValues.healthGoals || [];
    setValue('healthGoals', [...currentGoals, { goal: 'improve_health', priority: 'medium' }]);
  };

  const removeHealthGoal = (index: number) => {
    const currentGoals = watchedValues.healthGoals || [];
    setValue('healthGoals', currentGoals.filter((_, i) => i !== index));
  };

  const addMedicalCondition = () => {
    const currentConditions = watchedValues.medicalConditions || [];
    setValue('medicalConditions', [...currentConditions, { condition: 'diabetes_type2' }]);
  };

  const removeMedicalCondition = (index: number) => {
    const currentConditions = watchedValues.medicalConditions || [];
    setValue('medicalConditions', currentConditions.filter((_, i) => i !== index));
  };

  const addAllergy = () => {
    const currentAllergies = watchedValues.allergies || [];
    setValue('allergies', [...currentAllergies, '']);
  };

  const removeAllergy = (index: number) => {
    const currentAllergies = watchedValues.allergies || [];
    setValue('allergies', currentAllergies.filter((_, i) => i !== index));
  };

  const addDietaryRestriction = () => {
    const currentRestrictions = watchedValues.dietaryRestrictions || [];
    setValue('dietaryRestrictions', [...currentRestrictions, { type: 'vegetarian' }]);
  };

  const removeDietaryRestriction = (index: number) => {
    const currentRestrictions = watchedValues.dietaryRestrictions || [];
    setValue('dietaryRestrictions', currentRestrictions.filter((_, i) => i !== index));
  };

  const bmi = calculateBMI();
  const bmiInfo = bmi ? getBMICategory(bmi) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditing ? 'Update Health Profile' : 'Create Health Profile'}
              </h1>
              <p className="text-gray-600">
                Help us personalize your meal recommendations
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <User className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  {...register('age', { valueAsNumber: true })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your age"
                />
                {errors.age && (
                  <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  {...register('gender')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('height', { valueAsNumber: true })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your height in cm"
                />
                {errors.height && (
                  <p className="mt-1 text-sm text-red-600">{errors.height.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('weight', { valueAsNumber: true })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your weight in kg"
                />
                {errors.weight && (
                  <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Level *
                </label>
                <select
                  {...register('activityLevel')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select activity level</option>
                  <option value="sedentary">Sedentary (little to no exercise)</option>
                  <option value="lightly_active">Lightly Active (light exercise 1-3 days/week)</option>
                  <option value="moderately_active">Moderately Active (moderate exercise 3-5 days/week)</option>
                  <option value="very_active">Very Active (hard exercise 6-7 days/week)</option>
                  <option value="extremely_active">Extremely Active (very hard exercise, physical job)</option>
                </select>
                {errors.activityLevel && (
                  <p className="mt-1 text-sm text-red-600">{errors.activityLevel.message}</p>
                )}
              </div>
            </div>

            {/* BMI Display */}
            {bmi && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Scale className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">BMI:</span>
                  <span className="text-lg font-bold text-gray-900">{bmi}</span>
                  {bmiInfo && (
                    <span className={`text-sm font-medium ${bmiInfo.color}`}>
                      ({bmiInfo.category})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Health Goals */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Target className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Health Goals</h2>
              </div>
              <button
                type="button"
                onClick={addHealthGoal}
                className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Goal</span>
              </button>
            </div>

            {(watchedValues.healthGoals || []).map((goal, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Goal {index + 1}</h3>
                  {(watchedValues.healthGoals || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHealthGoal(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Goal Type
                    </label>
                    <select
                      {...register(`healthGoals.${index}.goal` as const)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="weight_loss">Weight Loss</option>
                      <option value="weight_gain">Weight Gain</option>
                      <option value="muscle_gain">Muscle Gain</option>
                      <option value="maintain_weight">Maintain Weight</option>
                      <option value="improve_health">Improve Health</option>
                      <option value="manage_diabetes">Manage Diabetes</option>
                      <option value="manage_hypertension">Manage Hypertension</option>
                      <option value="heart_health">Heart Health</option>
                      <option value="digestive_health">Digestive Health</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Value (optional)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register(`healthGoals.${index}.targetValue` as const, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 70 (kg)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      {...register(`healthGoals.${index}.priority` as const)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {errors.healthGoals && (
              <p className="mt-1 text-sm text-red-600">{errors.healthGoals.message}</p>
            )}
          </div>

          {/* Medical Conditions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Heart className="h-6 w-6 text-red-600" />
                <h2 className="text-xl font-semibold text-gray-900">Medical Conditions</h2>
              </div>
              <button
                type="button"
                onClick={addMedicalCondition}
                className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Condition</span>
              </button>
            </div>

            {(watchedValues.medicalConditions || []).length === 0 && (
              <p className="text-gray-500 text-center py-4">No medical conditions added</p>
            )}

            {(watchedValues.medicalConditions || []).map((condition, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Condition {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeMedicalCondition(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition
                    </label>
                    <select
                      {...register(`medicalConditions.${index}.condition` as const)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="diabetes_type1">Type 1 Diabetes</option>
                      <option value="diabetes_type2">Type 2 Diabetes</option>
                      <option value="hypertension">Hypertension</option>
                      <option value="heart_disease">Heart Disease</option>
                      <option value="kidney_disease">Kidney Disease</option>
                      <option value="liver_disease">Liver Disease</option>
                      <option value="thyroid_disorder">Thyroid Disorder</option>
                      <option value="pcod_pcos">PCOD/PCOS</option>
                      <option value="pregnancy">Pregnancy</option>
                      <option value="breastfeeding">Breastfeeding</option>
                      <option value="post_surgery">Post Surgery</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severity
                    </label>
                    <select
                      {...register(`medicalConditions.${index}.severity` as const)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select severity</option>
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      {...register(`medicalConditions.${index}.notes` as const)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Additional information about this condition"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Allergies */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <h2 className="text-xl font-semibold text-gray-900">Allergies</h2>
              </div>
              <button
                type="button"
                onClick={addAllergy}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Allergy</span>
              </button>
            </div>

            {(watchedValues.allergies || []).length === 0 && (
              <p className="text-gray-500 text-center py-4">No allergies added</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(watchedValues.allergies || []).map((allergy, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    {...register(`allergies.${index}` as const)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Peanuts, Shellfish, Dairy"
                  />
                  <button
                    type="button"
                    onClick={() => removeAllergy(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Apple className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Dietary Restrictions</h2>
              </div>
              <button
                type="button"
                onClick={addDietaryRestriction}
                className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Restriction</span>
              </button>
            </div>

            {(watchedValues.dietaryRestrictions || []).length === 0 && (
              <p className="text-gray-500 text-center py-4">No dietary restrictions added</p>
            )}

            {(watchedValues.dietaryRestrictions || []).map((restriction, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Restriction {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeDietaryRestriction(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      {...register(`dietaryRestrictions.${index}.type` as const)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="keto">Keto</option>
                      <option value="paleo">Paleo</option>
                      <option value="gluten_free">Gluten Free</option>
                      <option value="dairy_free">Dairy Free</option>
                      <option value="low_carb">Low Carb</option>
                      <option value="low_sodium">Low Sodium</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severity
                    </label>
                    <select
                      {...register(`dietaryRestrictions.${index}.severity` as const)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select severity</option>
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      {...register(`dietaryRestrictions.${index}.notes` as const)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Additional information about this restriction"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              <span>{loading ? 'Saving...' : isEditing ? 'Update Profile' : 'Create Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HealthProfilePage;
