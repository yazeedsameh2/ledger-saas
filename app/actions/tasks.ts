"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTask(input: {
  title: string;
  priority: "high" | "medium" | "low" | "";
  category: string;
  due: string;
  due_time: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title: input.title,
    priority: input.priority || null,
    category: input.category || null,
    due: input.due || null,
    due_time: input.due_time || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  revalidatePath("/home");
}

export async function updateTask(
  id: string,
  input: {
    title: string;
    priority: "high" | "medium" | "low" | "";
    category: string;
    due: string;
    due_time: string;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      title: input.title,
      priority: input.priority || null,
      category: input.category || null,
      due: input.due || null,
      due_time: input.due_time || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  revalidatePath("/home");
}

export async function toggleTask(id: string, done: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ done }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  revalidatePath("/home");
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  revalidatePath("/home");
}

export async function restoreTask(task: {
  id: string;
  title: string;
  priority: string | null;
  category: string | null;
  due: string | null;
  due_time: string | null;
  done: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("tasks").insert({ ...task, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  revalidatePath("/home");
}
