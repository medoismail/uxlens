import type { Metadata } from "next";
import Script from "next/script";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
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
    default: "UXLens — Free AI UX Audit Tool | Instant Website Analysis",
    template: "%s | UXLens",
  },
  description:
    "Free AI-powered UX audit tool. Paste any URL for a 9-layer diagnostic: conversion killers, trust signals, and actionable fixes in seconds.",
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
    "ux score checker",
    "landing page optimization",
    "trust signal analysis",
    "hero section optimizer",
    "cognitive load analysis",
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
    title: "UXLens — Free AI UX Audit Tool | Instant Website Analysis",
    description:
      "Free AI UX audit tool that finds every reason your page fails to convert. 9-layer diagnostic: conversion killers, trust signals, and actionable fixes.",
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
    title: "UXLens — Free AI UX Audit Tool",
    description:
      "Free AI UX audit tool. 9-layer diagnostic: conversion killers, trust signals, and actionable fixes.",
    images: ["/opengraph-image"],
  },
  category: "technology",
};

/* JSON-LD Structured Data */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "UXLens",
  url: SITE_URL,
  description:
    "AI-powered UX audit tool that analyzes landing pages across 9 diagnostic layers including conversion architecture, trust signals, confusion detection, and hero rewrite synthesis.",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web",
  offers: [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      name: "Free",
      description: "5 audits per month",
    },
    {
      "@type": "Offer",
      price: "12",
      priceCurrency: "USD",
      name: "Starter",
      description: "50 audits per month with full report access",
    },
    {
      "@type": "Offer",
      price: "29",
      priceCurrency: "USD",
      name: "Pro",
      description: "200 audits per month with full report access",
    },
    {
      "@type": "Offer",
      price: "79",
      priceCurrency: "USD",
      name: "Agency",
      description: "1,000 audits per month for teams and agencies",
    },
  ],
  featureList: [
    "9-Layer UX Diagnostic",
    "AI-Powered Conversion Killer Detection",
    "Trust Signal Matrix",
    "Confusion Detection Map",
    "Hero Section Rewrite",
    "Cognitive Load Analysis",
    "Quick Win Recommendations",
    "Detailed Findings & Fixes",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${interTight.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        <noscript>
          <div style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
            <h1>UXLens — AI-Powered UX Audit Tool</h1>
            <p>Analyze any landing page with our 9-layer UX diagnostic. Get conversion killers, trust signal analysis, confusion detection, and actionable fixes.</p>
            <p>Please enable JavaScript to use UXLens.</p>
          </div>
        </noscript>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PS3F3M5Q7D"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PS3F3M5Q7D');
          `}
        </Script>
        <Script
          src="https://app.lemonsqueezy.com/js/lemon.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
