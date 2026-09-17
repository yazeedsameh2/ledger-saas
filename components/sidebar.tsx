"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/tasks", label: "Tasks", icon: "tasks" },
  { href: "/study", label: "Study", icon: "study" },
  { href: "/gym", label: "Gym", icon: "gym" },
  { href: "/habits", label: "Habits", icon: "habits" },
  { href: "/goals", label: "Goals", icon: "goals" },
  { href: "/money", label: "Money", icon: "money" },
  { href: "/sleep", label: "Sleep", icon: "sleep" },
  { href: "/notes", label: "Notes", icon: "notes" },
  { href: "/statistics", label: "Statistics", icon: "stats" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

const ICONS: Record<string, string> = {
  home: "M4 11.5 12 4l8 7.5 M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9",
  tasks: "M8 11.5l2.2 2.2L16 8.5",
  study: "M4 6.5C4 5.7 4.7 5 5.5 5H12v14H5.5A1.5 1.5 0 0 1 4 17.5v-11Z M20 6.5c0-.8-.7-1.5-1.5-1.5H12v14h6.5a1.5 1.5 0 0 0 1.5-1.5v-11Z",
  gym: "M6 8v8M18 8v8M2 10v4M22 10v4M6 12h12",
  habits: "M12 4v4M12 16v4M4 12h4M16 12h4",
  goals: "M12 12",
  money: "M12 7.5v9M9.5 9.8c0-1 1-1.8 2.5-1.8s2.5.9 2.5 2c0 2.4-5 1.4-5 3.8 0 1.1 1.1 2 2.5 2s2.5-.7 2.5-1.8",
  sleep: "M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z",
  notes: "M6 3.5h9L19 8v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z M14 3.5V8h5",
  stats: "M4 20V10M11 20V4M18 20v-7",
  settings: "M12 12",
};

function NavIcon({ name }: { name: string }) {
  if (name === "tasks") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-[15px] w-[15px] opacity-75">
        <rect x="4" y="4" width="16" height="16" rx="1.5" />
        <path d={ICONS.tasks} />
      </svg>
    );
  }
  if (name === "goals") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[15px] w-[15px] opacity-75">
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4.8" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === "money") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="h-[15px] w-[15px] opacity-75">
        <circle cx="12" cy="12" r="8.5" />
        <path d={ICONS.money} />
      </svg>
    );
  }
  if (name === "settings") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[15px] w-[15px] opacity-75">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V19a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-[15px] w-[15px] opacity-75">
      <path d={ICONS[name]} />
    </svg>
  );
}

export function Sidebar({
  mobileOpen,
  onCloseMobile,
  isAdmin,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-[240] bg-black/35 sm:hidden" onClick={onCloseMobile} />
      )}
      <nav
        className={`fixed top-0 left-0 z-[250] flex h-screen w-[min(78vw,300px)] -translate-x-full flex-col border-r border-[var(--line)] bg-[var(--paper)] py-7 transition-transform sm:sticky sm:w-[240px] sm:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : ""
        }`}
      >
        <div className="mb-8 flex items-baseline gap-2 px-6">
          <span className="font-display text-[22px] text-[var(--accent)]">∞</span>
          <span className="font-display text-[17px]">Ledger</span>
        </div>

        <div className="flex-1 overflow-y-auto px-3.5">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`mb-px flex items-center gap-2.5 rounded px-3 py-2 text-[13.5px] transition-colors border-l-2 ${
                  active
                    ? "border-[var(--accent)] font-semibold text-[var(--ink)]"
                    : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={onCloseMobile}
              className={`mb-px flex items-center gap-2.5 rounded px-3 py-2 text-[13.5px] transition-colors border-l-2 ${
                pathname === "/admin"
                  ? "border-[var(--accent)] font-semibold text-[var(--ink)]"
                  : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-[15px] w-[15px] opacity-75">
                <path d="M17 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
                <circle cx="10" cy="7" r="4" />
                <path d="M22 20v-1a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Admin</span>
            </Link>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] px-6 pt-3.5">
          <button onClick={handleLogout} className="text-[12.5px] text-[var(--ink-soft)] hover:text-[var(--ink)]">
            Log out
          </button>
          <span className="font-mono text-[10.5px] text-[var(--ink-faint)]">v1.0</span>
        </div>
      </nav>
    </>
  );
}
