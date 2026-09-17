import { createClient } from "@/lib/supabase/server";
import { SleepClient } from "./sleep-client";
import type { SleepEntry } from "@/lib/types";

export default async function SleepPage() {
  const supabase = await createClient();
  const { data: entries } = await supabase.from("sleep_entries").select("*").order("date", { ascending: false });
  return <SleepClient initialEntries={(entries as SleepEntry[]) ?? []} />;
}
