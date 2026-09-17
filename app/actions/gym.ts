"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { WorkoutSet } from "@/lib/types";

export async function createRoutine(name: string, exerciseNames: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: workout, error } = await supabase
    .from("workouts")
    .insert({ user_id: user.id, name })
    .select()
    .single();
  if (error) throw new Error(error.message);

  if (exerciseNames.length) {
    const rows = exerciseNames.map((n, i) => ({ workout_id: workout.id, user_id: user.id, name: n, position: i }));
    const { error: exErr } = await supabase.from("workout_exercises").insert(rows);
    if (exErr) throw new Error(exErr.message);
  }
  revalidatePath("/gym");
}

export async function updateRoutine(workoutId: string, name: string, exerciseNames: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("workouts").update({ name }).eq("id", workoutId);
  if (error) throw new Error(error.message);

  await supabase.from("workout_exercises").delete().eq("workout_id", workoutId);
  if (exerciseNames.length) {
    const rows = exerciseNames.map((n, i) => ({ workout_id: workoutId, user_id: user.id, name: n, position: i }));
    const { error: exErr } = await supabase.from("workout_exercises").insert(rows);
    if (exErr) throw new Error(exErr.message);
  }
  revalidatePath("/gym");
}

export async function duplicateRoutine(workoutId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: original } = await supabase.from("workouts").select("name").eq("id", workoutId).single();
  const { data: exercises } = await supabase
    .from("workout_exercises")
    .select("name, position")
    .eq("workout_id", workoutId)
    .order("position");

  const { data: copy, error } = await supabase
    .from("workouts")
    .insert({ user_id: user.id, name: `Copy of ${original?.name ?? "routine"}` })
    .select()
    .single();
  if (error) throw new Error(error.message);

  if (exercises?.length) {
    const rows = exercises.map((e) => ({ workout_id: copy.id, user_id: user.id, name: e.name, position: e.position }));
    await supabase.from("workout_exercises").insert(rows);
  }
  revalidatePath("/gym");
}

export async function deleteRoutine(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/gym");
}

export async function logWorkout(input: {
  workout_id: string;
  date: string;
  notes: string;
  entries: { exercise_name: string; sets: WorkoutSet[] }[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: log, error } = await supabase
    .from("workout_logs")
    .insert({ user_id: user.id, workout_id: input.workout_id, date: input.date, notes: input.notes || null })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const rows = input.entries
    .filter((e) => e.sets.length)
    .map((e) => ({ log_id: log.id, user_id: user.id, exercise_name: e.exercise_name, sets: e.sets }));
  if (rows.length) {
    const { error: entriesErr } = await supabase.from("workout_log_entries").insert(rows);
    if (entriesErr) throw new Error(entriesErr.message);
  }
  revalidatePath("/gym");
  revalidatePath("/statistics");
}

export async function deleteWorkoutLog(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("workout_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/gym");
  revalidatePath("/statistics");
}

export async function logBodyWeight(date: string, weight: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("body_weights").insert({ user_id: user.id, date, weight });
  if (error) throw new Error(error.message);
  revalidatePath("/gym");
}

export async function deleteBodyWeight(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("body_weights").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/gym");
}
