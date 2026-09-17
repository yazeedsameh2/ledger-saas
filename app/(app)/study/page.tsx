import { createClient } from "@/lib/supabase/server";
import { StudyClient } from "./study-client";
import type { Subject, StudySession } from "@/lib/types";

export default async function StudyPage() {
  const supabase = await createClient();
  const [{ data: subjects }, { data: sessions }] = await Promise.all([
    supabase.from("subjects").select("*").order("id"),
    supabase.from("study_sessions").select("*").order("date", { ascending: false }),
  ]);
  return <StudyClient initialSubjects={(subjects as Subject[]) ?? []} initialSessions={(sessions as StudySession[]) ?? []} />;
}
