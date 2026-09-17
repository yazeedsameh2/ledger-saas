"use client";

import { useState, ReactNode } from "react";
import { Sidebar } from "./sidebar";

export function AppShell({ children, isAdmin }: { children: ReactNode; isAdmin?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} isAdmin={isAdmin} />

      <div className="flex flex-1 flex-col min-w-0">
        <div className="sticky top-0 z-[60] flex h-14 items-center justify-between border-b border-[var(--line)] bg-[var(--paper)] px-4 sm:hidden">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[19px] w-[19px]">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <main className="flex-1 w-full max-w-[880px] px-6 py-10 sm:px-14 sm:py-12">{children}</main>
      </div>
    </div>
  );
}
