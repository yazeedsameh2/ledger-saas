"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Chip, Field, Input, Label } from "@/components/ui";
import { ConfirmModal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { updateProfile, clearAllData } from "@/app/actions/settings";
import type { Profile } from "@/lib/types";

const THEMES = ["light", "dark", "sepia", "ocean", "forest", "rose", "slate", "clay", "mint"] as const;
const CURRENCIES = ["EGP", "USD", "EUR", "GBP", "SAR", "AED"];

export function SettingsClient({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [name, setName] = useState(profile.display_name ?? "");
  const [currency, setCurrency] = useState(profile.currency);
  const [theme, setTheme] = useState(profile.theme);
  const [lang, setLang] = useState(profile.lang);
  const [notifDue, setNotifDue] = useState(profile.notif_due_tasks);
  const [notifHabits, setNotifHabits] = useState(profile.notif_habits);
  const [notifGoals, setNotifGoals] = useState(profile.notif_goal_deadlines);
  const [habitTime, setHabitTime] = useState(profile.habit_reminder_time);
  const [dailyQuote, setDailyQuote] = useState(profile.daily_quote);
  const [confirmClear, setConfirmClear] = useState(false);
  const toast = useToast();

  async function saveTheme(t: string) {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    await updateProfile({ theme: t });
  }

  async function saveLang(l: string) {
    setLang(l);
    await updateProfile({ lang: l });
    router.refresh();
  }

  async function handleClear() {
    await clearAllData();
    toast.show("All data cleared.");
    router.push("/home");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-display text-[30px]">Settings</h1>
      </div>

      <section className="mb-9">
        <div className="mb-3.5 font-mono text-[11.5px] uppercase tracking-wider text-[var(--ink-faint)]">Profile</div>
        <Field>
          <Label htmlFor="name">Your name (optional, used on Home)</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => updateProfile({ display_name: name })}
            placeholder="e.g. Yazeed"
          />
        </Field>
      </section>

      <section className="mb-9">
        <div className="mb-3.5 font-mono text-[11.5px] uppercase tracking-wider text-[var(--ink-faint)]">Language</div>
        <div className="flex gap-2">
          <Chip active={lang === "en"} onClick={() => saveLang("en")}>English</Chip>
          <Chip active={lang === "ar"} onClick={() => saveLang("ar")}>العربية</Chip>
        </div>
      </section>

      <section className="mb-9">
        <div className="mb-3.5 font-mono text-[11.5px] uppercase tracking-wider text-[var(--ink-faint)]">Currency</div>
        <Field>
          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              updateProfile({ currency: e.target.value });
              toast.show("Currency updated.");
            }}
            className="w-full rounded border border-[var(--line)] bg-[var(--paper-raised)] px-3 py-2.5 text-[15px] focus:outline-none focus:border-[var(--accent)]"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
      </section>

      <section className="mb-9">
        <div className="mb-3.5 font-mono text-[11.5px] uppercase tracking-wider text-[var(--ink-faint)]">Appearance</div>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <Chip key={t} active={theme === t} onClick={() => saveTheme(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Chip>
          ))}
        </div>
      </section>

      <section className="mb-9">
        <div className="mb-3.5 font-mono text-[11.5px] uppercase tracking-wider text-[var(--ink-faint)]">Notifications</div>
        <p className="mb-4 text-[13px] leading-relaxed text-[var(--ink-soft)]">
          Get notified when a task reaches its due time, a habit needs attention, or a goal deadline is close.
        </p>
        <label className="mb-2.5 flex items-center gap-2 text-[13.5px]">
          <input type="checkbox" checked={notifDue} onChange={(e) => { setNotifDue(e.target.checked); updateProfile({ notif_due_tasks: e.target.checked }); }} className="w-auto" />
          Tasks due & overdue
        </label>
        <label className="mb-2.5 flex items-center gap-2 text-[13.5px]">
          <input type="checkbox" checked={notifHabits} onChange={(e) => { setNotifHabits(e.target.checked); updateProfile({ notif_habits: e.target.checked }); }} className="w-auto" />
          Daily habit reminder
        </label>
        {notifHabits && (
          <Field>
            <Label htmlFor="habitTime">Reminder time</Label>
            <Input
              id="habitTime"
              type="time"
              value={habitTime}
              onChange={(e) => setHabitTime(e.target.value)}
              onBlur={() => updateProfile({ habit_reminder_time: habitTime })}
              className="max-w-[160px]"
            />
          </Field>
        )}
        <label className="mt-3 flex items-center gap-2 text-[13.5px]">
          <input type="checkbox" checked={notifGoals} onChange={(e) => { setNotifGoals(e.target.checked); updateProfile({ notif_goal_deadlines: e.target.checked }); }} className="w-auto" />
          Goal deadlines (3 days out)
        </label>
      </section>

      <section className="mb-9">
        <div className="mb-3.5 font-mono text-[11.5px] uppercase tracking-wider text-[var(--ink-faint)]">Daily motivational quote</div>
        <p className="mb-4 text-[13px] leading-relaxed text-[var(--ink-soft)]">
          Show one short quote, once per day, the first time you open Ledger.
        </p>
        <label className="flex items-center gap-2 text-[13.5px]">
          <input type="checkbox" checked={dailyQuote} onChange={(e) => { setDailyQuote(e.target.checked); updateProfile({ daily_quote: e.target.checked }); }} className="w-auto" />
          Daily motivational quote
        </label>
      </section>

      <section>
        <div className="mb-3.5 font-mono text-[11.5px] uppercase tracking-wider text-[var(--ink-faint)]">Data</div>
        <p className="mb-4 text-[13px] leading-relaxed text-[var(--ink-soft)]">
          Your data lives in a private database, visible only to you.
        </p>
        <Button variant="danger" onClick={() => setConfirmClear(true)}>
          Clear all data
        </Button>
      </section>

      <ConfirmModal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear all data?"
        message="This removes everything permanently — tasks, habits, goals, money, sleep, notes, and study data. This cannot be undone."
        confirmLabel="Clear everything"
        danger
        onConfirm={handleClear}
      />
    </div>
  );
}
