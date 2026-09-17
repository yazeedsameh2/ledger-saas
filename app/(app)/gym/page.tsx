import { createClient } from "@/lib/supabase/server";
import { GymClient } from "./gym-client";
import type { Workout, WorkoutExercise, WorkoutLog, WorkoutLogEntry, BodyWeight } from "@/lib/types";

export default async function GymPage() {
  const supabase = await createClient();
  const [
    { data: workouts },
    { data: exercises },
    { data: logs },
    { data: entries },
    { data: bodyWeights },
  ] = await Promise.all([
    supabase.from("workouts").select("*").order("id"),
    supabase.from("workout_exercises").select("*").order("position"),
    supabase.from("workout_logs").select("*").order("date", { ascending: false }),
    supabase.from("workout_log_entries").select("*"),
    supabase.from("body_weights").select("*").order("date", { ascending: true }),
  ]);

  return (
    <GymClient
      initialWorkouts={(workouts as Workout[]) ?? []}
      initialExercises={(exercises as WorkoutExercise[]) ?? []}
      initialLogs={(logs as WorkoutLog[]) ?? []}
      initialEntries={(entries as WorkoutLogEntry[]) ?? []}
      initialBodyWeights={(bodyWeights as BodyWeight[]) ?? []}
    />
  );
}
