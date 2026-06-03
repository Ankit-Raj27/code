export type MealType =
  | "Breakfast"
  | "Lunch"
  | "Pre-workout"
  | "Dinner"
  | "Snack"
  | "Custom";

export type SyncStatus = "pending" | "synced" | "error";

export type EntryStoreName =
  | "profiles"
  | "weight_entries"
  | "meal_entries"
  | "workout_entries";

export type StoreName = EntryStoreName | "meta" | "sync_queue";

export interface BaseEntity {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status?: SyncStatus;
}

export interface ProfileRecord {
  id: string;
  display_name: string;
  daily_calorie_target: number | null;
  daily_protein_target: number | null;
  weight_goal_kg: number | null;
  buddy_id: string | null;
  share_targets: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeightEntry extends BaseEntity {
  value_kg: number;
  logged_at: string;
}

export interface MealEntry extends BaseEntity {
  meal_name: string;
  meal_type: MealType;
  note: string | null;
  logged_at: string;
}

export interface WorkoutEntry extends BaseEntity {
  workout_name: string;
  note: string | null;
  logged_at: string;
}

export interface SyncQueueItem {
  id: string;
  record_id: string;
  store_name: EntryStoreName;
  operation: "upsert";
  enqueued_at: string;
  last_error: string | null;
}

export interface MetaRecord {
  key: string;
  value: string;
}

export interface UserTargets {
  dailyCalories: number | null;
  dailyProtein: number | null;
  weightGoalKg: number | null;
}

export interface AppSnapshot {
  profiles: ProfileRecord[];
  weightEntries: WeightEntry[];
  mealEntries: MealEntry[];
  workoutEntries: WorkoutEntry[];
}

export interface AuthState {
  userId: string | null;
  email: string | null;
}

export interface LocalSession {
  userId: string;
  email: string;
}
