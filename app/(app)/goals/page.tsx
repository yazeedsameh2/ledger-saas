import { createClient } from "@/lib/supabase/server";
import { GoalsClient } from "./goals-client";
import type { Goal } from "@/lib/types";

export default async function GoalsPage() {
  const supabase = await createClient();
  const { data: goals } = await supabase.from("goals").select("*").order("deadline", { ascending: true, nullsFirst: false });
  return <GoalsClient initialGoals={(goals as Goal[]) ?? []} />;
}
