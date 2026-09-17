"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(input: Partial<{
  display_name: string;
  theme: string;
  lang: string;
  currency: string;
  daily_quote: boolean;
  notif_due_tasks: boolean;
  notif_habits: boolean;
  notif_goal_deadlines: boolean;
  habit_reminder_time: string;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("profiles").update(input).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function clearAllData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const tables = [
    "tasks", "subjects", "study_sessions", "workout_logs", "workouts",
    "body_weights", "habits", "goals", "transactions", "sleep_entries", "notes",
  ];
  for (const table of tables) {
    await supabase.from(table).delete().eq("user_id", user.id);
  }
  revalidatePath("/", "layout");
}
