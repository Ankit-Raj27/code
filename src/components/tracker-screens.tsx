"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Soup, Dumbbell, LucideIcon } from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";
import { PageLoader } from "@/components/loader";
import { WeightChart } from "@/components/weight-chart";
import { MEAL_TYPES } from "@/lib/constants";
import { useApp } from "@/hooks/use-app";
import { formatDateLabel, formatTimeLabel, isSameDay } from "@/lib/utils";
import type { MealType } from "@/lib/types";

function ScreenIntro({
  title,
  subtitle
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <motion.section
      className="hero"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <p className="eyebrow">Minimal, calm, private</p>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </motion.section>
  );
}

function PageStack({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="stack-xl"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.055 } }
      }}
    >
      {children}
    </motion.div>
  );
}

function MotionCard({ children, className = "card" }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      className={className}
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

function ActionTile({
  href,
  label,
  icon: Icon
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} className="action-tile">
      <Icon size={28} strokeWidth={2} />
      <span className="action-tile-label">{label}</span>
    </Link>
  );
}

function DateRail({
  selectedDate,
  onDateSelect
}: {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const selectedDay = new Date(selectedDate);
  const weekStart = new Date(selectedDay);
  weekStart.setDate(weekStart.getDate() - selectedDay.getDay() + 1);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {days.map((day, index) => {
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + index);
        const isActive = isSameDay(dayDate.toISOString(), selectedDate);
        const dateNum = dayDate.getDate();

        return (
          <button
            key={day}
            onClick={() => onDateSelect(dayDate.toISOString())}
            className={[
              "grid min-w-12 place-items-center rounded-2xl border px-2 py-2 text-xs cursor-pointer transition-all",
              isActive
                ? "border-[#dfff5b]/70 bg-[#dfff5b] text-[#111217]"
                : "border-white/10 bg-white/5 text-[#9c98ad] hover:border-white/20 hover:bg-white/10"
            ].join(" ")}
          >
            <span>{day}</span>
            <strong className="mt-1 text-sm">{dateNum}</strong>
          </button>
        );
      })}
    </div>
  );
}

function SignInNotice() {
  const { session } = useApp();

  if (session) {
    return null;
  }

  return (
    <section className="card">
      <h2>Sign in to sync</h2>
      <p>Local pages load now, and cloud sync unlocks after both friends sign in.</p>
      <Link href="/profile" className="button">
        Open profile
      </Link>
    </section>
  );
}

function SharedStatusCard() {
  const { currentProfile, buddyProfile } = useApp();
  const buddyId = currentProfile?.buddy_id ?? null;
  const buddyLabel = buddyProfile?.display_name ?? buddyId;

  return (
    <section className="card">
      <div className="card-header">
        <h2>Buddy space</h2>
        <span>{buddyId ? "Linked" : "Solo for now"}</span>
      </div>
      <p>
        {buddyLabel
          ? `You and ${buddyLabel} can view each other's progress.`
          : "Add your friend's email in Profile to view their synced progress."}
      </p>
      {currentProfile?.share_targets ? (
        <div className="inline-stat-grid">
          <div>
            <strong>{currentProfile.daily_calorie_target ?? "-"}</strong>
            <span>Calories</span>
          </div>
          <div>
            <strong>{currentProfile.daily_protein_target ?? "-"}</strong>
            <span>Protein g</span>
          </div>
          <div>
            <strong>{currentProfile.weight_goal_kg ?? "-"}</strong>
            <span>Goal kg</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function TodayScreen() {
  const { session, currentProfile, buddyProfile, mealEntries, weightEntries, workoutEntries } = useApp();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString());

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const handlePreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate.toISOString());
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate.toISOString());
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString());
  };

  const buddyId = currentProfile?.buddy_id ?? null;
  const buddyLabel = buddyProfile?.display_name ?? buddyId ?? "No buddy yet";
  
  const selectedMeals = mealEntries.filter(
    (entry) => entry.user_id === session?.userId && isSameDay(entry.logged_at, selectedDate)
  );
  const selectedWorkouts = workoutEntries.filter(
    (entry) => entry.user_id === session?.userId && isSameDay(entry.logged_at, selectedDate)
  );
  const selectedWeight = weightEntries.find(
    (entry) => entry.user_id === session?.userId && isSameDay(entry.logged_at, selectedDate)
  );
  const buddyMealsSelected = mealEntries.filter(
    (entry) => entry.user_id === buddyId && isSameDay(entry.logged_at, selectedDate)
  );
  const buddyWorkoutsSelected = workoutEntries.filter(
    (entry) => entry.user_id === buddyId && isSameDay(entry.logged_at, selectedDate)
  );
  const buddyWeightSelected = weightEntries.find(
    (entry) => entry.user_id === buddyId && isSameDay(entry.logged_at, selectedDate)
  );

  if (isInitialLoad) {
    return <PageLoader />;
  }

  return (
    <PageStack>
      <ScreenIntro
        title="What did I log today?"
        subtitle="Your own progress first, with your friend's latest shared progress right beside it."
      />
      <SignInNotice />
      <MotionCard>
        <div className="card-header">
          <h2>Weekly rhythm</h2>
          <span>{formatDateLabel(selectedDate)}</span>
        </div>
        <div className="week-navigation">
          <button onClick={handlePreviousWeek} className="week-nav-btn" aria-label="Previous week">
            ←
          </button>
          <DateRail selectedDate={selectedDate} onDateSelect={setSelectedDate} />
          <button onClick={handleNextWeek} className="week-nav-btn" aria-label="Next week">
            →
          </button>
        </div>
        {!isSameDay(selectedDate, new Date().toISOString()) && (
          <button onClick={handleToday} className="button button-secondary" style={{ marginTop: "0.75rem", width: "100%" }}>
            Back to Today
          </button>
        )}
      </MotionCard>
      <section className="grid-two">
        <MotionCard>
          <div className="card-header">
            <h2>{isSameDay(selectedDate, new Date().toISOString()) ? "Today" : "Selected Day"}</h2>
            <span>{formatDateLabel(selectedDate)}</span>
          </div>
          <div className="stack-sm">
            <div className="list-row">
              <strong>Weight</strong>
              <span>{selectedWeight ? `${selectedWeight.value_kg.toFixed(1)} kg` : "Not logged"}</span>
            </div>
            <div className="list-row">
              <strong>Meals</strong>
              <span>{selectedMeals.length} logged</span>
            </div>
            <div className="list-row">
              <strong>Workout</strong>
              <span>{selectedWorkouts.length ? selectedWorkouts[0].workout_name : "Not logged"}</span>
            </div>
          </div>
        </MotionCard>
        <MotionCard>
          <div className="card-header">
            <h2>Shared view</h2>
            <span>{buddyLabel}</span>
          </div>
          {buddyId ? (
            <div className="stack-sm">
              <div className="list-row">
                <strong>Weight</strong>
                <span>{buddyWeightSelected ? `${buddyWeightSelected.value_kg.toFixed(1)} kg` : "Not logged"}</span>
              </div>
              <div className="list-row">
                <strong>Meals</strong>
                <span>{buddyMealsSelected.length} logged</span>
              </div>
              <div className="list-row">
                <strong>Workout</strong>
                <span>{buddyWorkoutsSelected.length ? buddyWorkoutsSelected[0].workout_name : "Not logged"}</span>
              </div>
            </div>
          ) : (
            <p>Once linked, your friend&apos;s latest synced progress appears here.</p>
          )}
        </MotionCard>
      </section>
      <SharedStatusCard />
      <MotionCard>
        <div className="card-header">
          <h2>Quick add</h2>
          <span>One hand friendly</span>
        </div>
        <div className="quick-actions">
          <ActionTile href="/weight" label="Log weight" icon={Scale} />
          <ActionTile href="/diet" label="Add meal" icon={Soup} />
          <ActionTile href="/workout" label="Add workout" icon={Dumbbell} />
        </div>
      </MotionCard>
    </PageStack>
  );
}

export function WeightScreen() {
  const { session, currentProfile, buddyProfile, weightEntries, addWeightEntry } = useApp();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [valueKg, setValueKg] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const buddyId = currentProfile?.buddy_id ?? null;
  const buddyLabel = buddyProfile?.display_name ?? buddyId ?? "Unavailable";
  const ownEntries = weightEntries.filter((entry) => entry.user_id === session?.userId);
  const buddyEntries = weightEntries.filter((entry) => entry.user_id === buddyId);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = Number(valueKg);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a valid weight in kilograms.");
      return;
    }

    await addWeightEntry(parsed);
    setValueKg("");
  }

  if (isInitialLoad) {
    return <PageLoader />;
  }

  return (
    <PageStack>
      <ScreenIntro
        title="Am I progressing?"
        subtitle="Track recent weight calmly, with a simple trend and your buddy's latest synced number."
      />
      <MotionCard>
        <div className="card-header">
          <h2>Log weight</h2>
          <span>{currentProfile?.weight_goal_kg ? `Goal ${currentProfile.weight_goal_kg} kg` : "No goal yet"}</span>
        </div>
        <form className="inline-form" onSubmit={onSubmit}>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={valueKg}
            onChange={(event) => setValueKg(event.target.value)}
            placeholder="72.4"
            disabled={!session}
            required
          />
          <button className="button" type="submit" disabled={!session}>
            Save
          </button>
        </form>
        {error ? <p className="error-copy">{error}</p> : null}
      </MotionCard>
      <WeightChart entries={ownEntries} />
      <section className="grid-two">
        <MotionCard>
          <div className="card-header">
            <h2>Your recent entries</h2>
            <span>{ownEntries.length}</span>
          </div>
          <div className="stack-sm">
            {ownEntries.slice(0, 6).map((entry) => (
              <div className="list-row" key={entry.id}>
                <strong>{entry.value_kg.toFixed(1)} kg</strong>
                <span>{formatDateLabel(entry.logged_at)}</span>
              </div>
            ))}
            {!ownEntries.length ? <p>No entries yet.</p> : null}
          </div>
        </MotionCard>
        <MotionCard>
          <div className="card-header">
            <h2>Buddy latest</h2>
            <span>{buddyLabel}</span>
          </div>
          {buddyEntries[0] ? (
            <div className="stack-sm">
              <strong className="hero-number">{buddyEntries[0].value_kg.toFixed(1)} kg</strong>
              <p>{formatDateLabel(buddyEntries[0].logged_at)}</p>
            </div>
          ) : (
            <p>No synced weight from your buddy yet.</p>
          )}
        </MotionCard>
      </section>
    </PageStack>
  );
}

export function DietScreen() {
  const { session, currentProfile, buddyProfile, mealEntries, addMealEntry } = useApp();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState<MealType>("Breakfast");

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const buddyId = currentProfile?.buddy_id ?? null;
  const buddyLabel = buddyProfile?.display_name ?? buddyId ?? "Unavailable";

  const ownTodayMeals = mealEntries.filter(
    (entry) =>
      entry.user_id === session?.userId && isSameDay(entry.logged_at, new Date().toISOString())
  );
  const buddyMeals = mealEntries.filter((entry) => entry.user_id === buddyId).slice(0, 5);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mealName.trim()) {
      return;
    }

    await addMealEntry(mealName.trim(), mealType);
    setMealName("");
    setMealType("Breakfast");
  }

  if (isInitialLoad) {
    return <PageLoader />;
  }

  return (
    <PageStack>
      <ScreenIntro
        title="Did I hit my meals?"
        subtitle="Keep meals lightweight for now: a name, a type, and a clean daily list."
      />
      <MotionCard>
        <div className="card-header">
          <h2>Add meal</h2>
          <span>{ownTodayMeals.length} today</span>
        </div>
        <form className="stack" onSubmit={onSubmit}>
          <input
            type="text"
            value={mealName}
            onChange={(event) => setMealName(event.target.value)}
            placeholder="Chicken rice bowl"
            disabled={!session}
            required
          />
          <div className="chip-row">
            {MEAL_TYPES.map((type) => (
              <button
                type="button"
                key={type}
                className={mealType === type ? "chip active" : "chip"}
                onClick={() => setMealType(type)}
              >
                {type}
              </button>
            ))}
          </div>
          <button className="button" type="submit" disabled={!session}>
            Save meal
          </button>
        </form>
      </MotionCard>
      <section className="grid-two">
        <MotionCard>
          <div className="card-header">
            <h2>Meals today</h2>
            <span>{ownTodayMeals.length}</span>
          </div>
          <div className="stack-sm">
            {ownTodayMeals.map((entry) => (
              <div key={entry.id} className="list-item">
                <strong>{entry.meal_name}</strong>
                <span>
                  {entry.meal_type} - {formatTimeLabel(entry.logged_at)}
                </span>
              </div>
            ))}
            {!ownTodayMeals.length ? <p>Nothing logged today yet.</p> : null}
          </div>
        </MotionCard>
        <MotionCard>
          <div className="card-header">
            <h2>Buddy feed</h2>
            <span>{buddyLabel}</span>
          </div>
          <div className="stack-sm">
            {buddyMeals.map((entry) => (
              <div key={entry.id} className="list-item">
                <strong>{entry.meal_name}</strong>
                <span>
                  {entry.meal_type} - {formatDateLabel(entry.logged_at)}
                </span>
              </div>
            ))}
            {!buddyMeals.length ? <p>No synced meals from your buddy yet.</p> : null}
          </div>
        </MotionCard>
      </section>
    </PageStack>
  );
}

export function WorkoutScreen() {
  const { session, currentProfile, buddyProfile, workoutEntries, addWorkoutEntry } = useApp();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [workoutName, setWorkoutName] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const buddyId = currentProfile?.buddy_id ?? null;
  const buddyLabel = buddyProfile?.display_name ?? buddyId ?? "Unavailable";

  const ownTodayWorkouts = workoutEntries.filter(
    (entry) =>
      entry.user_id === session?.userId && isSameDay(entry.logged_at, new Date().toISOString())
  );
  const buddyWorkouts = workoutEntries
    .filter((entry) => entry.user_id === buddyId)
    .slice(0, 5);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workoutName.trim()) {
      return;
    }

    await addWorkoutEntry(workoutName.trim());
    setWorkoutName("");
  }

  if (isInitialLoad) {
    return <PageLoader />;
  }

  return (
    <PageStack>
      <ScreenIntro
        title="What did I train?"
        subtitle="Log the session name fast, keep momentum, and sync whenever the connection returns."
      />
      <MotionCard>
        <div className="card-header">
          <h2>Add workout</h2>
          <span>{ownTodayWorkouts.length} today</span>
        </div>
        <form className="inline-form" onSubmit={onSubmit}>
          <input
            type="text"
            value={workoutName}
            onChange={(event) => setWorkoutName(event.target.value)}
            placeholder="Push day"
            disabled={!session}
            required
          />
          <button className="button" type="submit" disabled={!session}>
            Save
          </button>
        </form>
      </MotionCard>
      <section className="grid-two">
        <MotionCard>
          <div className="card-header">
            <h2>Your sessions</h2>
            <span>{ownTodayWorkouts.length}</span>
          </div>
          <div className="stack-sm">
            {ownTodayWorkouts.map((entry) => (
              <div key={entry.id} className="list-item">
                <strong>{entry.workout_name}</strong>
                <span>{formatTimeLabel(entry.logged_at)}</span>
              </div>
            ))}
            {!ownTodayWorkouts.length ? <p>No workout logged today.</p> : null}
          </div>
        </MotionCard>
        <MotionCard>
          <div className="card-header">
            <h2>Buddy sessions</h2>
            <span>{buddyLabel}</span>
          </div>
          <div className="stack-sm">
            {buddyWorkouts.map((entry) => (
              <div key={entry.id} className="list-item">
                <strong>{entry.workout_name}</strong>
                <span>{formatDateLabel(entry.logged_at)}</span>
              </div>
            ))}
            {!buddyWorkouts.length ? <p>No synced workouts from your buddy yet.</p> : null}
          </div>
        </MotionCard>
      </section>
    </PageStack>
  );
}

export function ProfileScreen() {
  const {
    session,
    currentProfile,
    buddyProfile,
    updateTargets,
    updateBuddyEmail,
    syncNow
  } = useApp();
  const buddyLabel = buddyProfile?.display_name ?? currentProfile?.buddy_id ?? "Optional";
  const [displayName, setDisplayName] = useState(currentProfile?.display_name ?? "");
  const [dailyCalories, setDailyCalories] = useState(String(currentProfile?.daily_calorie_target ?? ""));
  const [dailyProtein, setDailyProtein] = useState(String(currentProfile?.daily_protein_target ?? ""));
  const [weightGoalKg, setWeightGoalKg] = useState(String(currentProfile?.weight_goal_kg ?? ""));
  const [buddyEmail, setBuddyEmail] = useState(currentProfile?.buddy_id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentProfile) {
      setDisplayName(currentProfile.display_name);
      setDailyCalories(String(currentProfile.daily_calorie_target ?? ""));
      setDailyProtein(String(currentProfile.daily_protein_target ?? ""));
      setWeightGoalKg(String(currentProfile.weight_goal_kg ?? ""));
      setBuddyEmail(currentProfile.buddy_id ?? "");
    }
  }, [currentProfile]);

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await updateTargets(
        {
          dailyCalories: dailyCalories ? Number(dailyCalories) : null,
          dailyProtein: dailyProtein ? Number(dailyProtein) : null,
          weightGoalKg: weightGoalKg ? Number(weightGoalKg) : null
        },
        displayName || "Friend"
      );
      setMessage("Profile saved locally and queued for sync.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not save profile.");
    }
  }

  async function onSaveBuddy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await updateBuddyEmail(buddyEmail);
      setMessage(buddyEmail.trim() ? "Friend email saved." : "Friend email removed.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not save friend email.");
    }
  }

  return (
    <PageStack>
      <ScreenIntro
        title="What are my targets?"
        subtitle="Set goals, manage your account, and create the private shared space between both friends."
      />
      <AuthPanel />
      {session ? (
        <>
          <MotionCard>
            <div className="card-header">
              <h2>Targets</h2>
              <button className="button secondary" onClick={() => syncNow()}>
                Sync now
              </button>
            </div>
            <form className="stack" onSubmit={onSaveProfile}>
              <label className="field">
                <span>Display name</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Ankit"
                />
              </label>
              <div className="grid-two">
                <label className="field">
                  <span>Daily calories</span>
                  <input
                    type="number"
                    value={dailyCalories}
                    onChange={(event) => setDailyCalories(event.target.value)}
                    placeholder="2200"
                  />
                </label>
                <label className="field">
                  <span>Protein grams</span>
                  <input
                    type="number"
                    value={dailyProtein}
                    onChange={(event) => setDailyProtein(event.target.value)}
                    placeholder="140"
                  />
                </label>
              </div>
              <label className="field">
                <span>Weight goal (kg)</span>
                <input
                  type="number"
                  step="0.1"
                  value={weightGoalKg}
                  onChange={(event) => setWeightGoalKg(event.target.value)}
                  placeholder="72"
                />
              </label>
              <button className="button" type="submit">
                Save targets
              </button>
            </form>
          </MotionCard>
          <MotionCard>
            <div className="card-header">
              <h2>Friend email</h2>
              <span>{buddyLabel}</span>
            </div>
            {currentProfile?.buddy_id ? (
              <p className="text-sm text-[#9c98ad]">Connected buddy: {buddyLabel}</p>
            ) : (
              <p className="text-sm text-[#9c98ad]">Add a friend email to keep their synced progress close.</p>
            )}
            <form className="stack" onSubmit={onSaveBuddy}>
              <label className="field">
                <span>Friend email</span>
                <input
                  type="email"
                  value={buddyEmail}
                  onChange={(event) => setBuddyEmail(event.target.value)}
                  placeholder="friend@example.com"
                />
              </label>
              <button className="button secondary" type="submit">
                Save friend
              </button>
            </form>
          </MotionCard>
        </>
      ) : null}
      {message ? <p className="success-copy">{message}</p> : null}
      {error ? <p className="error-copy">{error}</p> : null}
    </PageStack>
  );
}
