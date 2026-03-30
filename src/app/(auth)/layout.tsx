import type { Metadata } from "next";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Sign In — UXLens AI UX Audit Platform",
  description:
    "Sign in to UXLens to access your AI-powered UX audit dashboard, saved reports, heatmaps, and AI chat assistant.",
  robots: { index: false, follow: true },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        {children}
      </main>
    </div>
  );
}
