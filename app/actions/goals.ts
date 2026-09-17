"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type GoalInput = {
  title: string;
  category: string;
  deadline: string;
  progress: number;
  notes: string;
};

export async function createGoal(input: GoalInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    title: input.title,
    category: input.category || null,
    deadline: input.deadline || null,
    progress: input.progress,
    notes: input.notes || null,
    status: input.progress >= 100 ? "done" : "active",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
  revalidatePath("/home");
}

export async function updateGoal(id: string, input: GoalInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .update({
      title: input.title,
      category: input.category || null,
      deadline: input.deadline || null,
      progress: input.progress,
      notes: input.notes || null,
      status: input.progress >= 100 ? "done" : "active",
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
  revalidatePath("/home");
}

export async function toggleGoalDone(id: string, done: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .update({ status: done ? "done" : "active", progress: done ? 100 : undefined })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
  revalidatePath("/home");
}

export async function deleteGoal(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
  revalidatePath("/home");
}
