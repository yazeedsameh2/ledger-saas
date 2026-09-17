import { createClient } from "@/lib/supabase/server";

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function fmtDue(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user!.id).single();

  const [{ data: openTasks }, { data: habits }, { data: habitLogsToday }, { data: activeGoals }] = await Promise.all([
    supabase.from("tasks").select("*").eq("done", false).order("due", { ascending: true, nullsFirst: false }),
    supabase.from("habits").select("*"),
    supabase.from("habit_logs").select("habit_id").eq("date", todayISO()),
    supabase.from("goals").select("*").neq("status", "done").order("deadline", { ascending: true, nullsFirst: false }).limit(1),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Still up." : hour < 12 ? "Good morning." : hour < 18 ? "Good afternoon." : "Good evening.";
  const name = profile?.display_name ? `, ${profile.display_name}` : "";

  const nextTask = openTasks?.[0];
  const habitsDoneToday = habitLogsToday?.length ?? 0;
  const totalHabits = habits?.length ?? 0;
  const goal = activeGoals?.[0];

  const hasAnything = (openTasks?.length ?? 0) > 0 || totalHabits > 0 || (goal ? 1 : 0) > 0;

  const { count: totalOpenTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("done", false);
  const { count: totalActiveGoals } = await supabase
    .from("goals")
    .select("*", { count: "exact", head: true })
    .neq("status", "done");

  return (
    <div>
      <div className="mb-10">
        <div className="mb-1.5 font-mono text-[12.5px] text-[var(--ink-faint)]">{fmtDate(new Date())}</div>
        <h1 className="font-display text-[30px]">
          {greeting}
          {name}
        </h1>
      </div>

      {!hasAnything ? (
        <div className="flex flex-col items-center gap-3.5 rounded-lg border border-dashed border-[var(--line-strong)] px-5 py-16 text-center">
          <div className="mb-1 font-display text-[32px] text-[var(--ink-faint)]">∞</div>
          <h3 className="text-lg">This is your space.</h3>
          <p className="max-w-[320px] text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
            Nothing is here yet because nothing should be. Start in Tasks, Habits, or Goals — Home fills in as you go.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3.5 font-mono text-[11.5px] uppercase tracking-wider text-[var(--ink-faint)]">Today</div>
          <div className="mb-10 flex flex-col divide-y divide-[var(--line)]">
            <div className="flex items-center gap-3.5 py-4.5">
              <div className="flex-1">
                <div className="mb-1 text-xs text-[var(--ink-faint)]">Next task</div>
                {nextTask ? (
                  <>
                    <div className="text-[14.5px]">{nextTask.title}</div>
                    {nextTask.due && <div className="mt-0.5 text-xs text-[var(--ink-faint)]">Due {fmtDue(nextTask.due)}</div>}
                  </>
                ) : (
                  <div className="text-[14.5px] text-[var(--ink-faint)]">Nothing queued</div>
                )}
              </div>
              <a href="/tasks" className="rounded px-3 py-1.5 text-[12.5px] font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-black/5">
                Open
              </a>
            </div>

            {totalHabits > 0 && (
              <div className="flex items-center gap-3.5 py-4.5">
                <div className="flex-1">
                  <div className="mb-2 text-xs text-[var(--ink-faint)]">
                    Habits today · {habitsDoneToday}/{totalHabits}
                  </div>
                  <div className="h-[3px] rounded-full bg-[var(--line)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${totalHabits ? (habitsDoneToday / totalHabits) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <a href="/habits" className="rounded px-3 py-1.5 text-[12.5px] font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-black/5">
                  Open
                </a>
              </div>
            )}

            {goal && (
              <div className="flex items-center gap-3.5 py-4.5">
                <div className="flex-1">
                  <div className="mb-1 text-xs text-[var(--ink-faint)]">Goal in progress</div>
                  <div className="text-[14.5px]">{goal.title}</div>
                  <div className="mt-2 h-[3px] max-w-[220px] rounded-full bg-[var(--line)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${goal.progress}%` }} />
                  </div>
                </div>
                <a href="/goals" className="rounded px-3 py-1.5 text-[12.5px] font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-black/5">
                  Open
                </a>
              </div>
            )}
          </div>

          <div className="mb-3.5 font-mono text-[11.5px] uppercase tracking-wider text-[var(--ink-faint)]">This week</div>
          <div className="flex items-baseline justify-between border-t border-[var(--line)] py-4">
            <span className="text-[13px] text-[var(--ink-soft)]">Open tasks</span>
            <span className="font-mono text-[15px]">{totalOpenTasks ?? 0}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-[var(--line)] py-4">
            <span className="text-[13px] text-[var(--ink-soft)]">Active goals</span>
            <span className="font-mono text-[15px]">{totalActiveGoals ?? 0}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-[var(--line)] py-4">
            <span className="text-[13px] text-[var(--ink-soft)]">Habits tracked</span>
            <span className="font-mono text-[15px]">{totalHabits}</span>
          </div>
        </>
      )}
    </div>
  );
}
