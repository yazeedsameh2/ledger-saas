"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTransaction(input: {
  type: "income" | "expense";
  amount: number;
  date: string;
  category: string;
  notes: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    type: input.type,
    amount: input.amount,
    date: input.date,
    category: input.category || null,
    notes: input.notes || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/money");
  revalidatePath("/statistics");
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/money");
  revalidatePath("/statistics");
}
