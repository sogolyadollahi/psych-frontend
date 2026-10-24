// Types derived from the current Psych backend Pydantic schemas.
// Keep these aligned with app/schemas when the backend changes.

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  activity_level: string | null;
  goal: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardToday {
  date: string;
  calories: number;
  protein: number;
  workout_duration_minutes: number;
  active_supplements: number;
  total_supplements: number;
  latest_progress_date: string | null;
}

export interface DashboardSummary {
  start_date: string;
  end_date: string;
  total_calories: number;
  total_protein: number;
  total_workout_duration_minutes: number;
  active_supplements: number;
  total_supplements: number;
  latest_progress_date: string | null;
}

export interface Workout {
  id: number;
  muscle_group: string;
  duration_minutes: number;
  calories_burned: number | null;
  workout_date: string;
  created_at: string;
}

export interface Meal {
  id: number;
  user_id: number;
  name: string;
  meal_date: string;
}

export interface MealItem {
  id: number;
  meal_id: number;
  name: string;
  quantity: string | number;
  unit: string;
  calories: string | number;
  protein: string | number;
  carbs: string | number;
  fat: string | number;
  source: string | null;
  source_food_id: string | null;
}

export interface Supplement {
  id: number;
  name: string;
  dosage: string;
  reminder_time: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ProgressRecord {
  id: number;
  weight_kg: number | null;
  body_fat_percentage: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  progress_date: string;
  created_at: string;
  updated_at: string;
}

export interface Statistics {
  start_date: string;
  end_date: string;
  nutrition: Array<{ date: string; calories: number; protein: number }>;
  workouts: Array<{ date: string; duration_minutes: number; calories_burned: number }>;
  progress: Array<{
    date: string;
    weight: number | null;
    body_fat: number | null;
    chest: number | null;
    waist: number | null;
    arm: number | null;
    thigh: number | null;
  }>;
}
