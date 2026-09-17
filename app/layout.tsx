import type { Metadata } from "next";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ledger",
  description: "A calm, personal way to keep track of your days.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
