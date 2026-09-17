"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input, Label } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/home");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-5">
      <div className="w-full max-w-[400px]">
        <div className="mb-8">
          <div className="mb-1 flex items-baseline gap-2">
            <span className="font-display text-2xl text-[var(--accent)]">∞</span>
            <span className="font-display text-xl">Ledger</span>
          </div>
          <p className="text-[13.5px] text-[var(--ink-soft)]">A quiet place to keep track of your days.</p>
        </div>

        <form onSubmit={handleSubmit} className="border-t border-[var(--line)] pt-6">
          <Field>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>

          {error && <p className="mb-4 text-[13px] text-[var(--danger)]">{error}</p>}

          <Button type="submit" variant="primary" disabled={loading} className="w-full justify-center">
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <p className="mt-5 text-[13.5px] text-[var(--ink-soft)]">
          Need an account?{" "}
          <Link href="/signup" className="text-[var(--accent)] font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
