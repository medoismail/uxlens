import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — UX Audit Plans",
  description:
    "Choose your UXLens plan: Free (5 audits/mo), Starter ($12/mo, 50 audits), Pro ($29/mo, 200 audits), or Agency ($79/mo, 1,000 audits). Full AI-powered UX audits with conversion analysis, trust scoring, and hero rewrites.",
  alternates: {
    canonical: "https://www.uxlens.pro/pricing",
  },
  openGraph: {
    title: "UXLens Pricing — AI UX Audit Plans from Free to Agency",
    description:
      "Start free with 5 audits/month. Upgrade for full reports, trust matrix, hero rewrites, and more. Plans from $12/mo.",
    url: "https://www.uxlens.pro/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
