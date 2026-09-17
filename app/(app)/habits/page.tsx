import { createClient } from "@/lib/supabase/server";
import { HabitsClient } from "./habits-client";
import type { Habit, HabitLog } from "@/lib/types";

export default async function HabitsPage() {
  const supabase = await createClient();
  const [{ data: habits }, { data: logs }] = await Promise.all([
    supabase.from("habits").select("*").order("id"),
    supabase.from("habit_logs").select("*"),
  ]);

  return <HabitsClient initialHabits={(habits as Habit[]) ?? []} initialLogs={(logs as HabitLog[]) ?? []} />;
}
