"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { Show, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Layers, BarChart3, Eye, Sparkles, Zap, Shield } from "lucide-react";
import Link from "next/link";

const FEATURES = [
  { icon: Zap,       label: "One-Click Audit",     desc: "Audit any page directly from your toolbar" },
  { icon: Layers,    label: "10 Diagnostic Layers", desc: "Message clarity, cognitive load, trust signals & more" },
  { icon: Eye,       label: "AI Heatmap",           desc: "See where users look with attention heatmaps" },
  { icon: BarChart3, label: "Heuristic Eval",       desc: "Nielsen's 10 usability heuristics scored 0-10" },
  { icon: Sparkles,  label: "AI Rewrites",          desc: "Get optimized headlines, subheadlines & CTAs" },
  { icon: Shield,    label: "Full Reports",         desc: "Detailed findings with severity & fix suggestions" },
];

function Logo({ height = 28 }: { height?: number }) {
  const width = Math.round(height * (2141 / 617));
  return (
    <svg width={width} height={height} viewBox="0 0 2141 617" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M469.152 100.312L380.036 148.394L440.22 149.221C471.143 149.645 501.374 158.434 527.702 174.653L633 239.519L573.18 336.563L486.965 283.453L516.343 335.97C531.437 362.955 538.939 393.522 538.053 424.426L534.508 548.019L420.528 544.752L423.431 443.557L392.624 495.248C376.795 521.809 354.065 543.588 326.849 558.273L218.008 617L163.848 516.688L252.964 468.604L192.781 467.778C161.857 467.354 131.625 458.566 105.296 442.346L0 377.481L59.8199 280.436L146.032 333.546L116.656 281.03C101.562 254.045 94.06 223.478 94.9464 192.574L98.4916 68.981L212.472 72.2475L209.568 173.442L240.376 121.75C256.205 95.1905 278.934 73.4123 306.15 58.7279L414.992 0L469.152 100.312ZM276.138 284.453C267.545 298.872 267.299 316.781 275.494 331.43C283.685 346.073 299.078 355.235 315.855 355.465C332.632 355.695 348.271 346.959 356.861 332.546C365.454 318.127 365.7 300.218 357.506 285.569C349.314 270.925 333.921 261.763 317.144 261.533C300.367 261.303 284.728 270.04 276.138 284.453Z" fill="#4C2CFF" />
      <path d="M940.118 152.922H1005.88V354.81C1005.88 377.497 1000.45 397.4 989.598 414.52C978.881 431.5 963.849 444.723 944.502 454.187C925.155 463.652 902.607 468.384 876.858 468.384C851.109 468.384 828.561 463.652 809.214 454.187C789.868 444.723 774.836 431.5 764.118 414.52C753.401 397.4 748.043 377.497 748.043 354.81V152.922H813.599V349.381C813.599 361.212 816.243 371.79 821.532 381.115C826.821 390.302 834.198 397.539 843.663 402.828C853.127 407.978 864.192 410.553 876.858 410.553C889.663 410.553 900.798 407.978 910.262 402.828C919.727 397.539 927.034 390.302 932.184 381.115C937.473 371.79 940.118 361.212 940.118 349.381V152.922ZM1107.97 152.922L1170.61 258.981H1173.11L1235.95 152.922H1310.28L1215.29 308.67L1312.58 464H1236.58L1173.11 357.941H1170.61L1106.72 464H1031.56L1128.85 308.67L1033.23 152.922H1107.97ZM1401.1 152.922V464H1336.59V152.922H1401.1ZM1545.57 468.593C1521.63 468.593 1500.96 463.722 1483.56 453.979C1466.17 444.236 1452.8 430.387 1443.48 412.432C1434.29 394.338 1429.7 372.973 1429.7 348.337C1429.7 324.398 1434.29 303.381 1443.48 285.287C1452.8 267.193 1465.89 253.065 1482.73 242.905C1499.71 232.744 1519.61 227.664 1542.44 227.664C1557.89 227.664 1572.29 230.17 1585.66 235.18C1599.02 240.052 1610.71 247.428 1620.73 257.311C1630.75 267.054 1638.55 279.371 1644.11 294.264C1649.68 309.018 1652.47 326.346 1652.47 346.25V363.787H1455.38V323.911H1621.15L1591.08 334.349C1591.08 322.519 1589.28 312.219 1585.66 303.45C1582.04 294.682 1576.61 287.931 1569.37 283.199C1562.27 278.328 1553.44 275.892 1542.86 275.892C1532.28 275.892 1523.3 278.328 1515.92 283.199C1508.69 288.07 1503.12 294.682 1499.22 303.033C1495.33 311.384 1493.38 320.988 1493.38 331.844V360.029C1493.38 372.695 1495.6 383.551 1500.06 392.598C1504.51 401.506 1510.71 408.396 1518.64 413.267C1526.71 417.999 1535.97 420.366 1546.41 420.366C1553.64 420.366 1560.19 419.322 1566.03 417.234C1571.88 415.146 1576.89 412.084 1581.06 408.048C1585.38 404.011 1588.58 399.14 1590.67 393.433L1650.38 397.4C1647.45 411.736 1641.33 424.263 1632.01 434.98C1622.82 445.558 1610.92 453.84 1596.3 459.824C1581.69 465.67 1564.78 468.593 1545.57 468.593ZM1744.74 329.13V464H1680.23V230.587H1743.7V272.134H1746C1751.29 258.354 1759.71 247.498 1771.26 239.565C1782.81 231.631 1797.29 227.664 1814.69 227.664C1830.83 227.664 1844.89 231.213 1856.86 238.312C1868.97 245.41 1878.36 255.501 1885.04 268.585C1891.72 281.668 1895.06 297.326 1895.06 315.559V464H1830.55V327.042C1830.55 312.845 1826.86 301.711 1819.49 293.638C1812.11 285.426 1801.95 281.32 1789.01 281.32C1780.38 281.32 1772.72 283.269 1766.04 287.166C1759.36 290.924 1754.14 296.352 1750.38 303.45C1746.62 310.549 1744.74 319.109 1744.74 329.13ZM2127.02 297.187L2067.93 300.736C2066.4 293.359 2062.29 287.027 2055.61 281.738C2048.93 276.309 2039.96 273.595 2028.68 273.595C2018.66 273.595 2010.24 275.683 2003.42 279.859C1996.74 284.034 1993.4 289.601 1993.4 296.561C1993.4 302.128 1995.56 306.93 1999.87 310.966C2004.32 314.864 2011.91 317.926 2022.63 320.153L2065.01 328.504C2087.7 333.097 2104.61 340.543 2115.74 350.843C2126.88 361.142 2132.44 374.713 2132.44 391.554C2132.44 407.004 2127.99 420.505 2119.08 432.057C2110.17 443.47 2097.93 452.448 2082.34 458.989C2066.75 465.392 2048.86 468.593 2028.68 468.593C1997.78 468.593 1973.15 462.121 1954.77 449.177C1936.54 436.233 1925.89 418.695 1922.83 396.565L1986.09 393.225C1988.18 402.689 1992.91 409.857 2000.29 414.729C2007.66 419.6 2017.13 422.036 2028.68 422.036C2039.96 422.036 2049.07 419.809 2056.03 415.355C2063.13 410.901 2066.68 405.264 2066.68 398.444C2066.68 386.892 2056.66 379.097 2036.62 375.061L1996.32 366.71C1973.63 362.117 1956.72 354.253 1945.59 343.118C1934.45 331.983 1928.89 317.717 1928.89 300.319C1928.89 285.287 1932.99 272.343 1941.2 261.486C1949.42 250.63 1960.9 242.279 1975.65 236.433C1990.55 230.587 2007.94 227.664 2027.85 227.664C2057.35 227.664 2080.53 233.928 2097.37 246.454C2114.35 258.842 2124.23 275.753 2127.02 297.187Z" fill="currentColor" />
    </svg>
  );
}

export default function ExtensionWelcomePage() {
  const { isSignedIn } = useUser();

  // Send auth token to extension whenever user signs in
  useEffect(() => {
    if (!isSignedIn) return;

    async function sendTokenToExtension() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const token = await (window as any).Clerk?.session?.getToken();
        if (token) {
          window.postMessage({ type: "UXLENS_EXT_AUTH_TOKEN", token }, window.location.origin);
        }
      } catch {
        // Extension content script may not be present
      }
    }

    // Small delay to let Clerk fully initialize after modal sign-in
    const timer = setTimeout(sendTokenToExtension, 800);
    return () => clearTimeout(timer);
  }, [isSignedIn]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(ellipse, #4C2CFF 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-16"
        >
          <Link href="/" className="transition-opacity hover:opacity-70">
            <Logo height={22} />
          </Link>
          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="modal" forceRedirectUrl="/extension/welcome">
                <button className="text-xs font-medium text-foreground/50 hover:text-foreground transition-colors px-3 py-1.5">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/extension/welcome">
                <button className="text-xs font-medium text-primary-foreground px-4 py-2 rounded-lg transition-colors" style={{ background: "var(--brand, #4C2CFF)" }}>
                  Create account
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </motion.div>

        {/* Hero section */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 24 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6"
            style={{ borderColor: "var(--border)", background: "var(--s1, var(--card, #111113))" }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-foreground/60">Extension installed</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 180, damping: 22 }}
            className="text-[clamp(28px,4vw,44px)] font-bold tracking-[-1.5px] leading-[1.1] mb-4"
          >
            AI UX Audits,
            <br />
            <span style={{ color: "var(--brand, #4C2CFF)" }}>One Click Away</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-[15px] text-foreground/45 max-w-md mx-auto leading-relaxed"
          >
            Click the UXLens icon on any page to run a 10-layer diagnostic
            with heuristic evaluation, attention heatmaps, and conversion analysis.
          </motion.p>
        </div>

        {/* Auth card — signed out */}
        <Show when="signed-out">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 200, damping: 24 }}
            className="max-w-sm mx-auto mb-16 p-6 rounded-2xl border"
            style={{ borderColor: "var(--border)", background: "var(--card, #111113)" }}
          >
            <h2 className="text-sm font-semibold text-center mb-1">Get started</h2>
            <p className="text-xs text-foreground/40 text-center mb-5">
              Sign in or create an account to start auditing
            </p>

            <div className="space-y-2.5">
              <SignUpButton mode="modal" forceRedirectUrl="/extension/welcome">
                <button className="w-full py-2.5 text-sm font-medium text-white rounded-lg transition-all hover:brightness-110" style={{ background: "var(--brand, #4C2CFF)" }}>
                  Create free account
                </button>
              </SignUpButton>
              <SignInButton mode="modal" forceRedirectUrl="/extension/welcome">
                <button className="w-full py-2.5 text-sm font-medium rounded-lg border transition-colors hover:bg-foreground/[0.03]" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                  Sign in
                </button>
              </SignInButton>
            </div>

            <p className="text-[10px] text-foreground/30 text-center mt-4">
              Free plan includes 5 audits per month
            </p>
          </motion.div>
        </Show>

        {/* Signed in — success */}
        <Show when="signed-in">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 200, damping: 24 }}
            className="max-w-sm mx-auto mb-16 p-6 rounded-2xl border text-center"
            style={{ borderColor: "var(--border)", background: "var(--card, #111113)" }}
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "oklch(0.504 0.282 276.1 / 10%)" }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#4C2CFF" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold mb-1">You&apos;re all set!</h2>
            <p className="text-xs text-foreground/40 mb-5">
              Navigate to any page and click the UXLens icon to start auditing.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all hover:brightness-110"
              style={{ background: "var(--brand, #4C2CFF)" }}
            >
              Go to Dashboard
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </motion.div>
        </Show>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mb-16"
        >
          <h3 className="text-xs font-medium text-foreground/30 uppercase tracking-[0.15em] text-center mb-6">
            How it works
          </h3>

          <div className="flex flex-col sm:flex-row items-stretch gap-3 max-w-2xl mx-auto">
            {[
              { num: "1", title: "Browse", desc: "Navigate to any webpage" },
              { num: "2", title: "Click", desc: "Hit the UXLens toolbar icon" },
              { num: "3", title: "Audit", desc: "Get a full 10-layer report" },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.08 }}
                className="flex-1 p-4 rounded-xl border text-center"
                style={{ borderColor: "var(--border)", background: "var(--card, #111113)" }}
              >
                <span
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold mb-2"
                  style={{ background: "oklch(0.504 0.282 276.1 / 10%)", color: "#4C2CFF" }}
                >
                  {step.num}
                </span>
                <div className="text-sm font-semibold mb-0.5">{step.title}</div>
                <div className="text-[11px] text-foreground/40">{step.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <h3 className="text-xs font-medium text-foreground/30 uppercase tracking-[0.15em] text-center mb-6">
            What you get
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.label}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.7 + i * 0.06, type: "spring", stiffness: 300, damping: 26 }}
                className="p-4 rounded-xl border group transition-colors hover:bg-foreground/[0.02]"
                style={{ borderColor: "var(--border)" }}
              >
                <feat.icon className="w-4 h-4 mb-2.5 transition-colors" style={{ color: "#4C2CFF", opacity: 0.7 }} />
                <div className="text-[13px] font-medium mb-0.5">{feat.label}</div>
                <div className="text-[11px] text-foreground/35 leading-relaxed">{feat.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1 }}
          className="text-center mt-16 pt-8 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-center gap-4 text-[11px] text-foreground/30">
            <Link href="/" className="hover:text-foreground/50 transition-colors">Home</Link>
            <span>-</span>
            <Link href="/pricing" className="hover:text-foreground/50 transition-colors">Pricing</Link>
            <span>-</span>
            <Link href="/dashboard" className="hover:text-foreground/50 transition-colors">Dashboard</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
