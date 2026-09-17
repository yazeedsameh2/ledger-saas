import { createClient } from "@/lib/supabase/server";

function fmtMoney(n: number, currency: string) {
  const sign = n < 0 ? "-" : "";
  return `${sign}${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;
}
function duration(bedtime: string, wake: string) {
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);
  let mins = wh * 60 + wm - (bh * 60 + bm);
  if (mins <= 0) mins += 24 * 60;
  return mins;
}

export default async function StatisticsPage() {
  const supabase = await createClient();

  const [
    { data: tasks },
    { data: habits },
    { data: habitLogs },
    { data: sessions },
    { data: workoutLogs },
    { data: transactions },
    { data: sleepEntries },
    { data: notes },
    { data: goals },
    { data: profile },
  ] = await Promise.all([
    supabase.from("tasks").select("done"),
    supabase.from("habits").select("id"),
    supabase.from("habit_logs").select("habit_id, date"),
    supabase.from("study_sessions").select("minutes"),
    supabase.from("workout_logs").select("id"),
    supabase.from("transactions").select("type, amount"),
    supabase.from("sleep_entries").select("bedtime, wake_time"),
    supabase.from("notes").select("id"),
    supabase.from("goals").select("id"),
    supabase.from("profiles").select("currency").single(),
  ]);

  const totalItems =
    (tasks?.length ?? 0) +
    (habits?.length ?? 0) +
    (goals?.length ?? 0) +
    (transactions?.length ?? 0) +
    (sleepEntries?.length ?? 0) +
    (sessions?.length ?? 0) +
    (workoutLogs?.length ?? 0) +
    (notes?.length ?? 0);

  if (totalItems < 3) {
    return (
      <div>
        <div className="mb-10">
          <div className="mb-1.5 font-mono text-[12.5px] text-[var(--ink-faint)]">Overview</div>
          <h1 className="font-display text-[30px]">Statistics</h1>
        </div>
        <div className="flex flex-col items-center gap-3.5 rounded-lg border border-dashed border-[var(--line-strong)] px-5 py-16 text-center">
          <div className="mb-1 text-[var(--ink-faint)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="h-8 w-8">
              <path d="M4 20V10M11 20V4M18 20v-7" />
            </svg>
          </div>
          <h3 className="text-lg">Not enough data yet.</h3>
          <p className="max-w-[320px] text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
            Statistics appear once you&apos;ve logged a few things across tasks, habits, or other areas. Keep using Ledger and this page will fill in.
          </p>
        </div>
      </div>
    );
  }

  const doneTasks = tasks?.filter((t) => t.done).length ?? 0;
  const taskRate = tasks?.length ? Math.round((doneTasks / tasks.length) * 100) : 0;

  // Best streak across habits, computed from raw logs.
  let bestStreak = 0;
  for (const h of habits ?? []) {
    const dates = new Set((habitLogs ?? []).filter((l) => l.habit_id === h.id).map((l) => l.date));
    let streak = 0;
    const cur = new Date();
    while (true) {
      const iso = cur.toISOString().slice(0, 10);
      if (dates.has(iso)) {
        streak++;
        cur.setDate(cur.getDate() - 1);
      } else break;
    }
    bestStreak = Math.max(bestStreak, streak);
  }

  const studyHours = (sessions ?? []).reduce((a, b) => a + b.minutes, 0) / 60;
  const income = (transactions ?? []).filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0);
  const expense = (transactions ?? []).filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);
  const avgSleep = sleepEntries?.length
    ? sleepEntries.reduce((a, b) => a + duration(b.bedtime, b.wake_time), 0) / sleepEntries.length / 60
    : 0;
  const currency = profile?.currency ?? "EGP";

  const Row = ({ k, v }: { k: string; v: string | number }) => (
    <div className="flex items-baseline justify-between border-t border-[var(--line)] py-4 first:border-t-0">
      <span className="text-[13px] text-[var(--ink-soft)]">{k}</span>
      <span className="font-mono text-[15px]">{v}</span>
    </div>
  );
  const Section = ({ title }: { title: string }) => (
    <div className="mb-3.5 mt-8 font-mono text-[11.5px] uppercase tracking-wider text-[var(--ink-faint)] first:mt-0">{title}</div>
  );

  return (
    <div>
      <div className="mb-10">
        <div className="mb-1.5 font-mono text-[12.5px] text-[var(--ink-faint)]">Overview</div>
        <h1 className="font-display text-[30px]">Statistics</h1>
      </div>

      {!!tasks?.length && (
        <>
          <Section title="Tasks" />
          <Row k="Completion rate" v={`${taskRate}%`} />
          <Row k="Completed" v={`${doneTasks} / ${tasks.length}`} />
        </>
      )}
      {!!habits?.length && (
        <>
          <Section title="Habits" />
          <Row k="Total check-ins" v={habitLogs?.length ?? 0} />
          <Row k="Best streak" v={`${bestStreak} days`} />
        </>
      )}
      {!!sessions?.length && (
        <>
          <Section title="Study" />
          <Row k="Total hours" v={studyHours.toFixed(1)} />
        </>
      )}
      {!!workoutLogs?.length && (
        <>
          <Section title="Gym" />
          <Row k="Workouts logged" v={workoutLogs.length} />
        </>
      )}
      {!!transactions?.length && (
        <>
          <Section title="Money" />
          <Row k="Total income" v={fmtMoney(income, currency)} />
          <Row k="Total expenses" v={fmtMoney(expense, currency)} />
        </>
      )}
      {!!sleepEntries?.length && (
        <>
          <Section title="Sleep" />
          <Row k="Average duration" v={`${avgSleep.toFixed(1)} hrs`} />
        </>
      )}
    </div>
  );
}
