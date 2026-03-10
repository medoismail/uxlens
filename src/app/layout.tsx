import type { Metadata } from "next";
import Script from "next/script";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { InstallBanner } from "@/components/install-banner";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://www.uxlens.pro";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "UXLens — AI UX Audit Platform | Heatmaps, Dashboard & PDF Export",
    template: "%s | UXLens",
  },
  description:
    "AI-powered UX audit platform with screenshot heatmaps, 10-layer diagnostic, heuristic evaluation, trust analysis, and actionable fixes. Save audits to your dashboard, export PDF reports, and chat with AI.",
  keywords: [
    "ux audit tool",
    "website ux analysis",
    "ai ux review",
    "landing page audit",
    "conversion optimization tool",
    "ux diagnostic",
    "website analysis tool",
    "free ux audit",
    "landing page analyzer",
    "conversion rate optimization",
    "ux review tool",
    "website audit tool",
    "ai website analyzer",
    "ux heatmap tool",
    "attention heatmap",
    "website screenshot analysis",
    "ux audit dashboard",
    "pdf ux report",
    "ai ux chat",
    "website conversion audit",
    "ux feedback tool",
  ],
  authors: [{ name: "UXLens" }],
  creator: "UXLens",
  publisher: "UXLens",
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "UXLens",
    title: "UXLens — AI UX Audit Platform | Heatmaps, Dashboard & PDF Export",
    description:
      "AI UX audit platform with screenshot heatmaps, 10-layer diagnostic, heuristic evaluation, and actionable fixes. Save audits, export PDFs, and chat with AI about your findings.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "UXLens — AI-Powered UX Audit Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UXLens — AI UX Audit Platform",
    description:
      "AI UX audit platform with screenshot heatmaps, 10-layer diagnostic, heuristic evaluation, dashboard, PDF export, and AI chat.",
    images: ["/opengraph-image"],
  },
  category: "technology",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "UXLens",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

/* JSON-LD Structured Data */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "UXLens",
  url: SITE_URL,
  description:
    "AI-powered UX audit platform with screenshot heatmaps, 10-layer diagnostic, heuristic evaluation, audit dashboard, PDF export, and AI chat assistant for discussing findings.",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web",
  offers: [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      name: "Free",
      description: "5 audits/month with full scores, heatmaps, all killers, trust matrix, confusion map",
    },
    {
      "@type": "Offer",
      price: "12",
      priceCurrency: "USD",
      name: "Starter",
      description: "50 audits/month with strategic fixes, recommendations, hero rewrite, PDF export",
    },
    {
      "@type": "Offer",
      price: "29",
      priceCurrency: "USD",
      name: "Pro",
      description: "200 audits/month with AI chat assistant (50 msg/mo) and all Starter features",
    },
    {
      "@type": "Offer",
      price: "79",
      priceCurrency: "USD",
      name: "Agency",
      description: "1,000 audits/month with AI chat (200 msg/mo) and priority analysis queue",
    },
  ],
  featureList: [
    "10-Layer UX Diagnostic",
    "Nielsen's Heuristic Evaluation",
    "Page Screenshot + Attention Heatmap",
    "AI-Powered Conversion Killer Detection",
    "Trust Signal Matrix",
    "Confusion Detection Map",
    "Hero Section Rewrite",
    "Cognitive Load Analysis",
    "Quick Win Recommendations",
    "PDF Export",
    "AI Chat Assistant",
    "Audit History Dashboard",
  ],
  creator: {
    "@type": "Organization",
    name: "UXLens",
    url: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#4C2CFF" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${interTight.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ClerkProvider>
        {children}
        </ClerkProvider>
        <noscript>
          <div style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
            <h1>UXLens — AI-Powered UX Audit Tool</h1>
            <p>Analyze any landing page with our 10-layer UX diagnostic. Get heuristic evaluation, conversion killers, trust signal analysis, confusion detection, and actionable fixes.</p>
            <p>Please enable JavaScript to use UXLens.</p>
          </div>
        </noscript>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
        <Script
          src="https://app.lemonsqueezy.com/js/lemon.js"
          strategy="lazyOnload"
        />
        <InstallBanner />
      </body>
    </html>
  );
}
