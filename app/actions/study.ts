"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createSubject(name: string, goalHours: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("subjects").insert({ user_id: user.id, name, goal_hours: goalHours });
  if (error) throw new Error(error.message);
  revalidatePath("/study");
}

export async function updateSubject(id: string, name: string, goalHours: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("subjects").update({ name, goal_hours: goalHours }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/study");
}

export async function deleteSubject(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/study");
}

export async function createSession(input: { subject_id: string; date: string; minutes: number; notes: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("study_sessions").insert({
    user_id: user.id,
    subject_id: input.subject_id,
    date: input.date,
    minutes: input.minutes,
    notes: input.notes || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/study");
}

export async function deleteSession(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("study_sessions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/study");
}
