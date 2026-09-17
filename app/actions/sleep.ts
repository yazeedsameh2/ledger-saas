"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createSleepEntry(input: { date: string; bedtime: string; wake_time: string; notes: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("sleep_entries").insert({
    user_id: user.id,
    date: input.date,
    bedtime: input.bedtime,
    wake_time: input.wake_time,
    notes: input.notes || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/sleep");
}

export async function deleteSleepEntry(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("sleep_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/sleep");
}
