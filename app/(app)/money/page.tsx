import { createClient } from "@/lib/supabase/server";
import { MoneyClient } from "./money-client";
import type { Transaction } from "@/lib/types";

export default async function MoneyPage() {
  const supabase = await createClient();
  const [{ data: transactions }, { data: profile }] = await Promise.all([
    supabase.from("transactions").select("*").order("date", { ascending: false }),
    supabase.from("profiles").select("currency").single(),
  ]);
  return <MoneyClient initialTransactions={(transactions as Transaction[]) ?? []} currency={profile?.currency ?? "EGP"} />;
}
