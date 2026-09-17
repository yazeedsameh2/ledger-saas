"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createNote(input: { title: string; body: string; pinned: boolean }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("notes").insert({
    user_id: user.id,
    title: input.title || null,
    body: input.body || null,
    pinned: input.pinned,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/notes");
}

export async function updateNote(id: string, input: { title: string; body: string; pinned: boolean }) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notes")
    .update({ title: input.title || null, body: input.body || null, pinned: input.pinned, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/notes");
}

export async function deleteNote(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/notes");
}
