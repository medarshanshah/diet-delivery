import { ApiResponse } from '@shared/types';

export interface HealthProfileData {
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  healthGoals: Array<{
    goal: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'maintain_weight' | 'improve_health' | 'manage_diabetes' | 'manage_hypertension' | 'heart_health' | 'digestive_health';
    targetValue?: number;
    targetDate?: string;
    priority?: 'low' | 'medium' | 'high';
  }>;
  medicalConditions?: Array<{
    condition: 'diabetes_type1' | 'diabetes_type2' | 'hypertension' | 'heart_disease' | 'kidney_disease' | 'liver_disease' | 'thyroid_disorder' | 'pcod_pcos' | 'pregnancy' | 'breastfeeding' | 'post_surgery';
    severity?: 'mild' | 'moderate' | 'severe';
    diagnosed?: string;
    notes?: string;
  }>;
  allergies?: string[];
  dietaryRestrictions?: Array<{
    type: 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'gluten_free' | 'dairy_free' | 'low_carb' | 'low_sodium';
    severity?: 'mild' | 'moderate' | 'severe';
    notes?: string;
  }>;
}

export interface WeightEntry {
  weight: number;
  notes?: string;
}

export interface NutritionRecommendations {
  dailyCalories: number;
  macroTargets: {
    protein: number;
    carbs: number;
    fats: number;
  };
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

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

class HealthProfileService {
  private baseUrl = '/api/health-profile';

  /**
   * Get the current user's health profile
   */
  async getHealthProfile(): Promise<HealthProfileData> {
    const response = await fetch(this.baseUrl, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch health profile');
    }

    const data: ApiResponse<HealthProfileData> = await response.json();
    return data.data;
  }

  /**
   * Create a new health profile
   */
  async createHealthProfile(profileData: HealthProfileData): Promise<HealthProfileData> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create health profile');
    }

    const data: ApiResponse<HealthProfileData> = await response.json();
    return data.data;
  }

  /**
   * Update the complete health profile
   */
  async updateHealthProfile(profileData: Partial<HealthProfileData>): Promise<HealthProfileData> {
    const response = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update health profile');
    }

    const data: ApiResponse<HealthProfileData> = await response.json();
    return data.data;
  }

  /**
   * Update basic information (age, gender, height, weight, activity level)
   */
  async updateBasicInfo(basicInfo: {
    age?: number;
    gender?: 'male' | 'female' | 'other';
    height?: number;
    weight?: number;
    activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/basic-info`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(basicInfo)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update basic information');
    }

    const data: ApiResponse<any> = await response.json();
    return data.data;
  }

  /**
   * Update dietary restrictions
   */
  async updateDietaryRestrictions(dietaryRestrictions: Array<{
    type: string;
    severity?: string;
    notes?: string;
  }>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/dietary-restrictions`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ dietaryRestrictions })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update dietary restrictions');
    }

    const data: ApiResponse<any> = await response.json();
    return data.data;
  }

  /**
   * Update allergies
   */
  async updateAllergies(allergies: string[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/allergies`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ allergies })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update allergies');
    }

    const data: ApiResponse<any> = await response.json();
    return data.data;
  }

  /**
   * Update health goals
   */
  async updateHealthGoals(healthGoals: Array<{
    goal: string;
    targetValue?: number;
    targetDate?: string;
    priority?: string;
  }>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/goals`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ healthGoals })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update health goals');
    }

    const data: ApiResponse<any> = await response.json();
    return data.data;
  }

  /**
   * Update medical conditions
   */
  async updateMedicalConditions(medicalConditions: Array<{
    condition: string;
    severity?: string;
    diagnosed?: string;
    notes?: string;
  }>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/medical-conditions`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ medicalConditions })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update medical conditions');
    }

    const data: ApiResponse<any> = await response.json();
    return data.data;
  }

  /**
   * Add a weight entry to weight history
   */
  async addWeightEntry(weightEntry: WeightEntry): Promise<any> {
    const response = await fetch(`${this.baseUrl}/weight-history`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(weightEntry)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add weight entry');
    }

    const data: ApiResponse<any> = await response.json();
    return data.data;
  }

  /**
   * Get weight history
   */
  async getWeightHistory(limit?: number): Promise<any> {
    const url = limit ? `${this.baseUrl}/weight-history?limit=${limit}` : `${this.baseUrl}/weight-history`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch weight history');
    }

    const data: ApiResponse<any> = await response.json();
    return data.data;
  }

  /**
   * Get personalized nutrition recommendations
   */
  async getNutritionRecommendations(): Promise<NutritionRecommendations> {
    const response = await fetch(`${this.baseUrl}/nutrition-recommendations`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch nutrition recommendations');
    }

    const data: ApiResponse<NutritionRecommendations> = await response.json();
    return data.data;
  }

  /**
   * Delete health profile
   */
  async deleteHealthProfile(): Promise<void> {
    const response = await fetch(this.baseUrl, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete health profile');
    }
  }
}

// Export a singleton instance
export const healthProfileService = new HealthProfileService();
export default healthProfileService;