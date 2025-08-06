import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Heart,
  Scale,
  Target,
  Activity,
  AlertTriangle,
  Apple,
  Edit,
  TrendingUp,
  Calendar,
  Award
} from 'lucide-react';

interface HealthProfile {
  age: number;
  gender: string;
  height: number;
  weight: number;
  activityLevel: string;
  healthGoals: Array<{
    goal: string;
    targetValue?: number;
    priority?: string;
  }>;
  medicalConditions?: Array<{
    condition: string;
    severity?: string;
  }>;
  allergies?: string[];
  dietaryRestrictions?: Array<{
    type: string;
    severity?: string;
  }>;
}

interface NutritionRecommendations {
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  waterIntake: number;
  mealDistribution: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snacks: number;
  };
}

const HealthProfileSummary: React.FC = () => {
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [nutritionRecs, setNutritionRecs] = useState<NutritionRecommendations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHealthData = async () => {
      try {
        const { healthProfileService } = await import('../services/healthProfileService');
        
        // Load health profile
        const profileData = await healthProfileService.getHealthProfile();
        setHealthProfile(profileData);

        // Load nutrition recommendations
        const nutritionData = await healthProfileService.getNutritionRecommendations();
        setNutritionRecs(nutritionData);
      } catch (error) {
        console.error('Error loading health data:', error);
        // Profile doesn't exist, will show create profile prompt
      } finally {
        setLoading(false);
      }
    };

    loadHealthData();
  }, []);

  const formatActivityLevel = (level: string) => {
    const levels: { [key: string]: string } = {
      sedentary: 'Sedentary',
      lightly_active: 'Lightly Active',
      moderately_active: 'Moderately Active',
      very_active: 'Very Active',
      extremely_active: 'Extremely Active'
    };
    return levels[level] || level;
  };

  const formatGoal = (goal: string) => {
    const goals: { [key: string]: string } = {
      weight_loss: 'Weight Loss',
      weight_gain: 'Weight Gain',
      muscle_gain: 'Muscle Gain',
      maintain_weight: 'Maintain Weight',
      improve_health: 'Improve Health',
      manage_diabetes: 'Manage Diabetes',
      manage_hypertension: 'Manage Hypertension',
      heart_health: 'Heart Health',
      digestive_health: 'Digestive Health'
    };
    return goals[goal] || goal;
  };

  const formatCondition = (condition: string) => {
    const conditions: { [key: string]: string } = {
      diabetes_type1: 'Type 1 Diabetes',
      diabetes_type2: 'Type 2 Diabetes',
      hypertension: 'Hypertension',
      heart_disease: 'Heart Disease',
      kidney_disease: 'Kidney Disease',
      liver_disease: 'Liver Disease',
      thyroid_disorder: 'Thyroid Disorder',
      pcod_pcos: 'PCOD/PCOS',
      pregnancy: 'Pregnancy',
      breastfeeding: 'Breastfeeding',
      post_surgery: 'Post Surgery'
    };
    return conditions[condition] || condition;
  };

  const formatDietaryRestriction = (type: string) => {
    const types: { [key: string]: string } = {
      vegetarian: 'Vegetarian',
      vegan: 'Vegan',
      keto: 'Keto',
      paleo: 'Paleo',
      gluten_free: 'Gluten Free',
      dairy_free: 'Dairy Free',
      low_carb: 'Low Carb',
      low_sodium: 'Low Sodium'
    };
    return types[type] || type;
  };

  const calculateBMI = () => {
    if (healthProfile) {
      const heightInMeters = healthProfile.height / 100;
      return (healthProfile.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: string) => {
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 18.5) return { category: 'Underweight', color: 'text-blue-600 bg-blue-100' };
    if (bmiValue < 25) return { category: 'Normal', color: 'text-green-600 bg-green-100' };
    if (bmiValue < 30) return { category: 'Overweight', color: 'text-yellow-600 bg-yellow-100' };
    return { category: 'Obese', color: 'text-red-600 bg-red-100' };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!healthProfile) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center">
        <div className="mb-4">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Complete Your Health Profile
          </h3>
          <p className="text-gray-600 mb-6">
            Help us personalize your meal recommendations by setting up your health profile.
          </p>
          <Link
            to="/profile/health-profile"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <User className="h-5 w-5 mr-2" />
            Create Health Profile
          </Link>
        </div>
      </div>
    );
  }

  const bmi = calculateBMI();
  const bmiInfo = bmi ? getBMICategory(bmi) : null;

  return (
    <div className="space-y-6">
      {/* Header with Edit Button */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Health Profile</h2>
          <Link
            to="/profile/health-profile"
            className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Profile</span>
          </Link>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-2 mx-auto">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">Age</p>
            <p className="text-lg font-semibold text-gray-900">{healthProfile.age} years</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-2 mx-auto">
              <User className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">Gender</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">{healthProfile.gender}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-2 mx-auto">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">Height</p>
            <p className="text-lg font-semibold text-gray-900">{healthProfile.height} cm</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-2 mx-auto">
              <Scale className="h-6 w-6 text-orange-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">Weight</p>
            <p className="text-lg font-semibold text-gray-900">{healthProfile.weight} kg</p>
          </div>
        </div>

        {/* BMI and Activity Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bmi && bmiInfo && (
            <div className="p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">BMI</p>
                  <p className="text-2xl font-bold text-gray-900">{bmi}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${bmiInfo.color}`}>
                  {bmiInfo.category}
                </div>
              </div>
            </div>
          )}

          <div className="p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <Activity className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Activity Level</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatActivityLevel(healthProfile.activityLevel)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Goals */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Target className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Health Goals</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {healthProfile.healthGoals.map((goal, index) => (
            <div key={index} className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">
                  {formatGoal(goal.goal)}
                </span>
                {goal.priority && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                    goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {goal.priority}
                  </span>
                )}
              </div>
              {goal.targetValue && (
                <p className="text-sm text-green-600 mt-1">Target: {goal.targetValue}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Medical Conditions */}
      {healthProfile.medicalConditions && healthProfile.medicalConditions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Medical Conditions</h3>
          </div>
          <div className="space-y-3">
            {healthProfile.medicalConditions.map((condition, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-red-800">
                  {formatCondition(condition.condition)}
                </span>
                {condition.severity && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    condition.severity === 'severe' ? 'bg-red-100 text-red-800' :
                    condition.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {condition.severity}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Allergies and Dietary Restrictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Allergies */}
        {healthProfile.allergies && healthProfile.allergies.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">Allergies</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {healthProfile.allergies.map((allergy, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full"
                >
                  {allergy}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dietary Restrictions */}
        {healthProfile.dietaryRestrictions && healthProfile.dietaryRestrictions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Apple className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Dietary Restrictions</h3>
            </div>
            <div className="space-y-2">
              {healthProfile.dietaryRestrictions.map((restriction, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-800">
                    {formatDietaryRestriction(restriction.type)}
                  </span>
                  {restriction.severity && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      restriction.severity === 'severe' ? 'bg-red-100 text-red-800' :
                      restriction.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {restriction.severity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Nutrition Recommendations */}
      {nutritionRecs && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Award className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Daily Nutrition Goals</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-600">Calories</p>
              <p className="text-2xl font-bold text-blue-900">{nutritionRecs.dailyCalories}</p>
              <p className="text-xs text-blue-600">kcal</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-600">Protein</p>
              <p className="text-2xl font-bold text-green-900">{nutritionRecs.proteinGrams}</p>
              <p className="text-xs text-green-600">grams</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-yellow-600">Carbs</p>
              <p className="text-2xl font-bold text-yellow-900">{nutritionRecs.carbsGrams}</p>
              <p className="text-xs text-yellow-600">grams</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-purple-600">Fats</p>
              <p className="text-2xl font-bold text-purple-900">{nutritionRecs.fatsGrams}</p>
              <p className="text-xs text-purple-600">grams</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Meal Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Breakfast</span>
                  <span className="text-sm font-medium">{nutritionRecs.mealDistribution.breakfast} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Lunch</span>
                  <span className="text-sm font-medium">{nutritionRecs.mealDistribution.lunch} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Dinner</span>
                  <span className="text-sm font-medium">{nutritionRecs.mealDistribution.dinner} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Snacks</span>
                  <span className="text-sm font-medium">{nutritionRecs.mealDistribution.snacks} kcal</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Hydration Goal</h4>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-900">{nutritionRecs.waterIntake}</p>
                <p className="text-sm text-blue-600">ml per day</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthProfileSummary;