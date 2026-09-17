"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createHabit(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("habits").insert({ user_id: user.id, name });
  if (error) throw new Error(error.message);
  revalidatePath("/habits");
  revalidatePath("/home");
}

export async function updateHabit(id: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("habits").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/habits");
}

export async function deleteHabit(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("habits").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/habits");
  revalidatePath("/home");
}

export async function toggleHabitToday(habitId: string, date: string, currentlyDone: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (currentlyDone) {
    const { error } = await supabase.from("habit_logs").delete().eq("habit_id", habitId).eq("date", date);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("habit_logs").insert({ user_id: user.id, habit_id: habitId, date });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/habits");
  revalidatePath("/home");
}
