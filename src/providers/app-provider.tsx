"use client";

import {
  useCallback,
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren
} from "react";
import { DEFAULT_TARGETS, SESSION_STORAGE_KEY } from "@/lib/constants";
import { formatCloudErrorMessage } from "@/lib/cloud-errors";
import { enqueueSync, listRecords, putRecord, readMeta, upsertMeta } from "@/lib/local-store";
import { seedProfileIfMissing, syncAll } from "@/lib/sync";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type {
  LocalSession,
  MealEntry,
  ProfileRecord,
  UserTargets,
  WeightEntry,
  WorkoutEntry
} from "@/lib/types";
import { createId, createUserIdFromEmail, normalizeEmail } from "@/lib/utils";

interface AppContextValue {
  hydrated: boolean;
  session: LocalSession | null;
  online: boolean;
  syncing: boolean;
  syncError: string | null;
  profiles: ProfileRecord[];
  currentProfile: ProfileRecord | null;
  buddyProfile: ProfileRecord | null;
  weightEntries: WeightEntry[];
  mealEntries: MealEntry[];
  workoutEntries: WorkoutEntry[];
  lastSyncAt: string | null;
  canUseCloud: boolean;
  signInWithEmail: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  addWeightEntry: (valueKg: number, loggedAt?: string) => Promise<void>;
  addMealEntry: (mealName: string, mealType: MealEntry["meal_type"]) => Promise<void>;
  addWorkoutEntry: (workoutName: string) => Promise<void>;
  updateTargets: (targets: UserTargets, displayName: string) => Promise<void>;
  updateBuddyEmail: (email: string) => Promise<void>;
  syncNow: () => Promise<void>;
}

export const AppContext = createContext<AppContextValue | null>(null);

function buildDefaultProfile(session: LocalSession): ProfileRecord {
  const timestamp = new Date().toISOString();

  return {
    id: session.userId,
    display_name: session.email.split("@")[0] ?? "Friend",
    daily_calorie_target: DEFAULT_TARGETS.dailyCalories,
    daily_protein_target: DEFAULT_TARGETS.dailyProtein,
    weight_goal_kg: DEFAULT_TARGETS.weightGoalKg,
    buddy_id: null,
    share_targets: true,
    created_at: timestamp,
    updated_at: timestamp
  };
}

export function AppProvider({ children }: PropsWithChildren) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<LocalSession | null>(null);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [mealEntries, setMealEntries] = useState<MealEntry[]>([]);
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const seededRef = useRef(false);

  const persistSession = useCallback((nextSession: LocalSession | null) => {
    if (typeof window === "undefined") {
      return;
    }

    if (nextSession) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
      return;
    }

    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  const loadLocalState = useCallback(async () => {
    const [localProfiles, localWeight, localMeals, localWorkouts, syncMeta] =
      await Promise.all([
        listRecords<ProfileRecord>("profiles"),
        listRecords<WeightEntry>("weight_entries"),
        listRecords<MealEntry>("meal_entries"),
        listRecords<WorkoutEntry>("workout_entries"),
        readMeta("last_sync_at")
      ]);

    setProfiles(localProfiles.sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
    setWeightEntries(localWeight.sort((a, b) => b.logged_at.localeCompare(a.logged_at)));
    setMealEntries(localMeals.sort((a, b) => b.logged_at.localeCompare(a.logged_at)));
    setWorkoutEntries(localWorkouts.sort((a, b) => b.logged_at.localeCompare(a.logged_at)));
    setLastSyncAt(syncMeta?.value ?? null);
    setHydrated(true);
  }, []);

  const syncNow = useCallback(async () => {
    if (!supabase || !online || !session) {
      return;
    }

    try {
      setSyncing(true);
      setSyncError(null);
      await syncAll(supabase, session.userId);
      await loadLocalState();
    } catch (error) {
      setSyncError(formatCloudErrorMessage(error));
    } finally {
      setSyncing(false);
    }
  }, [loadLocalState, online, session, supabase]);

  const currentProfile = session
    ? profiles.find((profile) => profile.id === session.userId) ?? null
    : null;
  const buddyProfile = currentProfile?.buddy_id
    ? profiles.find((profile) => profile.id === currentProfile.buddy_id) ?? null
    : null;

  useEffect(() => {
    loadLocalState().catch(() => setHydrated(true));
    setOnline(window.navigator.onLine);
    const savedSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSession) {
      try {
        setSession(JSON.parse(savedSession) as LocalSession);
      } catch {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }

    const handleOnline = () => {
      setOnline(true);
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadLocalState]);

  useEffect(() => {
    if (!hydrated || !session || seededRef.current) {
      return;
    }

    seededRef.current = true;
    const profile = currentProfile ?? buildDefaultProfile(session);
    const tasks = [
      upsertMeta({ key: "session_email", value: session.email }),
      currentProfile ? Promise.resolve() : putRecord("profiles", profile)
    ];

    Promise.all(tasks)
      .then(async () => {
        if (supabase) {
          await seedProfileIfMissing(supabase, profile);
        }
        await loadLocalState();
        await syncNow();
      })
      .catch(() => {
        seededRef.current = false;
      });
  }, [currentProfile, hydrated, loadLocalState, session, supabase, syncNow]);

  useEffect(() => {
    if (!online || !session) {
      return;
    }

    syncNow().catch(() => undefined);
  }, [online, session, syncNow]);

  const signInWithEmail = useCallback(async (email: string) => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return { error: "Enter a valid email address." };
    }

    const nextSession: LocalSession = {
      email: normalizedEmail,
      userId: createUserIdFromEmail(normalizedEmail)
    };

    seededRef.current = false;
    persistSession(nextSession);
    setSession(nextSession);
    return { error: null };
  }, [persistSession]);

  const signOut = useCallback(async () => {
    seededRef.current = false;
    persistSession(null);
    setSession(null);
  }, [persistSession]);

  const addWeightEntry = useCallback(async (valueKg: number, loggedAt = new Date().toISOString()) => {
    if (!session) {
      throw new Error("Please sign in first.");
    }

    const entry: WeightEntry = {
      id: createId(),
      user_id: session.userId,
      value_kg: valueKg,
      logged_at: loggedAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      sync_status: "pending"
    };

    await putRecord("weight_entries", entry);
    await enqueueSync("weight_entries", entry.id);
    await loadLocalState();
    await syncNow();
  }, [loadLocalState, session, syncNow]);

  const addMealEntry = useCallback(async (mealName: string, mealType: MealEntry["meal_type"]) => {
    if (!session) {
      throw new Error("Please sign in first.");
    }

    const entry: MealEntry = {
      id: createId(),
      user_id: session.userId,
      meal_name: mealName,
      meal_type: mealType,
      note: null,
      logged_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      sync_status: "pending"
    };

    await putRecord("meal_entries", entry);
    await enqueueSync("meal_entries", entry.id);
    await loadLocalState();
    await syncNow();
  }, [loadLocalState, session, syncNow]);

  const addWorkoutEntry = useCallback(async (workoutName: string) => {
    if (!session) {
      throw new Error("Please sign in first.");
    }

    const entry: WorkoutEntry = {
      id: createId(),
      user_id: session.userId,
      workout_name: workoutName,
      note: null,
      logged_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      sync_status: "pending"
    };

    await putRecord("workout_entries", entry);
    await enqueueSync("workout_entries", entry.id);
    await loadLocalState();
    await syncNow();
  }, [loadLocalState, session, syncNow]);

  const updateTargets = useCallback(async (targets: UserTargets, displayName: string) => {
    if (!session) {
      throw new Error("Please sign in first.");
    }

    const now = new Date().toISOString();
    const existing = currentProfile ?? buildDefaultProfile(session);
    const nextProfile: ProfileRecord = {
      ...existing,
      display_name: displayName,
      daily_calorie_target: targets.dailyCalories,
      daily_protein_target: targets.dailyProtein,
      weight_goal_kg: targets.weightGoalKg,
      updated_at: now
    };

    await putRecord("profiles", nextProfile);
    await enqueueSync("profiles", nextProfile.id);
    await loadLocalState();
    await syncNow();
  }, [currentProfile, loadLocalState, session, syncNow]);

  const updateBuddyEmail = useCallback(async (email: string) => {
    if (!session) {
      throw new Error("Please sign in first.");
    }

    const normalizedEmail = normalizeEmail(email);
    const buddyId = normalizedEmail ? createUserIdFromEmail(normalizedEmail) : null;

    if (buddyId === session.userId) {
      throw new Error("Use your friend's email, not your own.");
    }

    const now = new Date().toISOString();
    const existing = currentProfile ?? buildDefaultProfile(session);
    const nextProfile: ProfileRecord = {
      ...existing,
      buddy_id: buddyId,
      updated_at: now
    };

    await putRecord("profiles", nextProfile);
    await enqueueSync("profiles", nextProfile.id);
    if (supabase) {
      const { error } = await supabase.from("profiles").upsert(nextProfile);
      if (error) {
        throw new Error(formatCloudErrorMessage(error));
      }
    }
    await loadLocalState();
    await syncNow();
  }, [currentProfile, loadLocalState, session, supabase, syncNow]);

  const value = useMemo<AppContextValue>(() => {
    return {
      hydrated,
      session,
      online,
      syncing,
      syncError,
      profiles,
      currentProfile,
      buddyProfile,
      weightEntries,
      mealEntries,
      workoutEntries,
      lastSyncAt,
      canUseCloud: Boolean(supabase),
      signInWithEmail,
      signOut,
      addWeightEntry,
      addMealEntry,
      addWorkoutEntry,
      updateTargets,
      updateBuddyEmail,
      syncNow
    };
  }, [
    addMealEntry,
    addWeightEntry,
    addWorkoutEntry,
    hydrated,
    session,
    online,
    syncing,
    syncError,
    profiles,
    currentProfile,
    buddyProfile,
    weightEntries,
    mealEntries,
    workoutEntries,
    lastSyncAt,
    supabase,
    signInWithEmail,
    signOut,
    syncNow,
    updateBuddyEmail,
    updateTargets
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
