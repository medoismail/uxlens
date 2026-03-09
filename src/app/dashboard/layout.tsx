import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Your Audit History",
  description: "View and manage your past UX audits. Access your full audit history and reports.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
