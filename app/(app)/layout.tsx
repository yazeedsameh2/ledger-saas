import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("theme, lang, is_admin")
    .eq("id", user.id)
    .single();

  // Keep last_seen_at fresh without blocking the response.
  supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", user.id)
    .then(() => {});

  const theme = profile?.theme ?? "light";
  const lang = profile?.lang ?? "en";

  return (
    <div data-theme={theme} dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <AppShell isAdmin={profile?.is_admin ?? false}>{children}</AppShell>
    </div>
  );
}
