import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myProfile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!myProfile?.is_admin) redirect("/home");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (profiles as Profile[]) ?? [];
  const now = Date.now();
  const activeLast24h = list.filter((p) => now - new Date(p.last_seen_at).getTime() < 24 * 60 * 60 * 1000).length;
  const activeLast7d = list.filter((p) => now - new Date(p.last_seen_at).getTime() < 7 * 24 * 60 * 60 * 1000).length;

  return (
    <div>
      <div className="mb-10">
        <div className="mb-1.5 font-mono text-[12.5px] text-[var(--ink-faint)]">Admin</div>
        <h1 className="font-display text-[30px]">Users</h1>
      </div>

      <div className="mb-9 grid grid-cols-3 gap-px overflow-hidden rounded border border-[var(--line)] bg-[var(--line)]">
        <div className="bg-[var(--paper)] px-5 py-4">
          <div className="text-xs text-[var(--ink-faint)]">Total signups</div>
          <div className="font-mono text-2xl">{list.length}</div>
        </div>
        <div className="bg-[var(--paper)] px-5 py-4">
          <div className="text-xs text-[var(--ink-faint)]">Active (24h)</div>
          <div className="font-mono text-2xl">{activeLast24h}</div>
        </div>
        <div className="bg-[var(--paper)] px-5 py-4">
          <div className="text-xs text-[var(--ink-faint)]">Active (7d)</div>
          <div className="font-mono text-2xl">{activeLast7d}</div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-3.5 rounded-lg border border-dashed border-[var(--line-strong)] px-5 py-16 text-center">
          <h3 className="text-lg">No users yet.</h3>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-[var(--line-strong)] text-xs uppercase tracking-wider text-[var(--ink-faint)]">
                <th className="pb-3 pr-4 font-medium">Email</th>
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 font-medium">Signed up</th>
                <th className="pb-3 pr-4 font-medium">Last seen</th>
                <th className="pb-3 font-medium">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {list.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 pr-4">{p.email}</td>
                  <td className="py-3 pr-4 text-[var(--ink-soft)]">{p.display_name || "—"}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-[var(--ink-soft)]">{fmtDateTime(p.created_at)}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-[var(--ink-soft)]">{fmtDateTime(p.last_seen_at)}</td>
                  <td className="py-3">
                    {p.is_admin && (
                      <span className="rounded-full border border-[var(--accent)] px-2 py-0.5 text-xs text-[var(--accent)]">Admin</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
