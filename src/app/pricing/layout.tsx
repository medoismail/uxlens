import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — AI UX Audit Plans",
  description:
    "Start free with 5 audits/month: full scores, heatmaps, all killers, trust matrix. Upgrade for strategic fixes, PDF export, and AI chat assistant. Plans from $12/mo.",
  alternates: {
    canonical: "https://www.uxlens.pro/pricing",
  },
  openGraph: {
    title: "UXLens Pricing — AI UX Audit Plans from Free to Agency",
    description:
      "Start free with 5 audits/month. Upgrade for strategic fixes, PDF export, and AI chat. Plans from $12/mo.",
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
