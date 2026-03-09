import type { Metadata } from "next";
import Script from "next/script";
import { Inter_Tight } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UXLens — Instant UX Audits for Landing Pages",
  description:
    "Get instant AI-powered UX feedback on your landing page. Spot weak messaging, unclear CTAs, and conversion blockers in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${interTight.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Script
          src="https://app.lemonsqueezy.com/js/lemon.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
