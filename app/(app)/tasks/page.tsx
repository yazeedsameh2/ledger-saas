import { createClient } from "@/lib/supabase/server";
import { TasksClient } from "./tasks-client";
import type { Task } from "@/lib/types";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .order("done", { ascending: true })
    .order("due", { ascending: true, nullsFirst: false });

  return <TasksClient initialTasks={(tasks as Task[]) ?? []} />;
}
