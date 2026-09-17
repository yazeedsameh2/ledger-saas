import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://wxrhybkyjmygiuoujomw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4cmh5Ymt5am15Z2l1b3Vqb213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNTgwNjEsImV4cCI6MjEwNDczNDA2MX0.ZHJOzFOsqCnfKhgNHTpc4D5e_LHO0TGA66AYBLdJORI";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
