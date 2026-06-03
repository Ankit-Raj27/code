import type { MealType } from "@/lib/types";

export const DB_NAME = "progress-tracker-db";
export const DB_VERSION = 1;
export const APP_NAME = "Personal Progress Tracker";

export const MEAL_TYPES: MealType[] = [
  "Breakfast",
  "Lunch",
  "Pre-workout",
  "Dinner",
  "Snack",
  "Custom"
];

export const NAV_ITEMS = [
  { href: "/today", label: "Today" },
  { href: "/weight", label: "Weight" },
  { href: "/diet", label: "Diet" },
  { href: "/workout", label: "Workout" },
  { href: "/profile", label: "Profile" }
];

export const DEFAULT_TARGETS = {
  dailyCalories: 2200,
  dailyProtein: 140,
  weightGoalKg: 72
};

export const SESSION_STORAGE_KEY = "progress-tracker-session";
