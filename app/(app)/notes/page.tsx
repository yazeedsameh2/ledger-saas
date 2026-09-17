import { createClient } from "@/lib/supabase/server";
import { NotesClient } from "./notes-client";
import type { Note } from "@/lib/types";

export default async function NotesPage() {
  const supabase = await createClient();
  const { data: notes } = await supabase.from("notes").select("*").order("pinned", { ascending: false }).order("updated_at", { ascending: false });
  return <NotesClient initialNotes={(notes as Note[]) ?? []} />;
}
