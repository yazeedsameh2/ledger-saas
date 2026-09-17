"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input, Label } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      router.push("/home");
      router.refresh();
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-5">
        <div className="w-full max-w-[400px] text-center">
          <div className="mb-3 font-display text-2xl text-[var(--accent)]">∞</div>
          <h1 className="mb-2 font-display text-xl">Check your email</h1>
          <p className="text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
            We sent a confirmation link to {email}. Open it to activate your account.
          </p>
        </div>
      </div>
    );
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
            <Label htmlFor="name">Name (optional)</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Yazeed" />
          </Field>
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
              autoComplete="new-password"
              minLength={8}
            />
          </Field>

          {error && <p className="mb-4 text-[13px] text-[var(--danger)]">{error}</p>}

          <Button type="submit" variant="primary" disabled={loading} className="w-full justify-center">
            {loading ? "Creating account…" : "Sign up"}
          </Button>
        </form>

        <p className="mt-5 text-[13.5px] text-[var(--ink-soft)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent)] font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
