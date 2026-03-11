"use client";

import Link from "next/link";
import { Show, UserButton, SignInButton } from "@clerk/nextjs";
import { useSubscription } from "@/hooks/use-subscription";

const PLAN_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  free: { label: "Free", color: "var(--foreground)", bg: "var(--s2)", border: "var(--border)" },
  starter: { label: "Starter", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  pro: { label: "Pro", color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" },
  agency: { label: "Agency", color: "#db2777", bg: "#fdf2f8", border: "#f9a8d4" },
};

function PlanBadge() {
  const { plan, isVerifying } = useSubscription();

  if (isVerifying) return null;

  const config = PLAN_LABELS[plan] || PLAN_LABELS.free;

  return (
    <Link
      href={plan === "free" ? "/pricing" : "/dashboard"}
      className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border transition-all hover:opacity-80"
      style={{
        color: config.color,
        background: config.bg,
        borderColor: config.border,
      }}
    >
      {config.label}
    </Link>
  );
}

/** Full UXLens logo: icon mark + "UXLens" wordmark */
function Logo({ height = 26 }: { height?: number }) {
  // Original viewBox is 2141 x 617 — aspect ratio ~3.47:1
  const width = Math.round(height * (2141 / 617));
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 2141 617"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M469.152 100.312L380.036 148.394L440.22 149.221C471.143 149.645 501.374 158.434 527.702 174.653L633 239.519L573.18 336.563L486.965 283.453L516.343 335.97C531.437 362.955 538.939 393.522 538.053 424.426L534.508 548.019L420.528 544.752L423.431 443.557L392.624 495.248C376.795 521.809 354.065 543.588 326.849 558.273L218.008 617L163.848 516.688L252.964 468.604L192.781 467.778C161.857 467.354 131.625 458.566 105.296 442.346L0 377.481L59.8199 280.436L146.032 333.546L116.656 281.03C101.562 254.045 94.06 223.478 94.9464 192.574L98.4916 68.981L212.472 72.2475L209.568 173.442L240.376 121.75C256.205 95.1905 278.934 73.4123 306.15 58.7279L414.992 0L469.152 100.312ZM276.138 284.453C267.545 298.872 267.299 316.781 275.494 331.43C283.685 346.073 299.078 355.235 315.855 355.465C332.632 355.695 348.271 346.959 356.861 332.546C365.454 318.127 365.7 300.218 357.506 285.569C349.314 270.925 333.921 261.763 317.144 261.533C300.367 261.303 284.728 270.04 276.138 284.453Z"
        fill="#4C2CFF"
      />
      <path
        d="M940.118 152.922H1005.88V354.81C1005.88 377.497 1000.45 397.4 989.598 414.52C978.881 431.5 963.849 444.723 944.502 454.187C925.155 463.652 902.607 468.384 876.858 468.384C851.109 468.384 828.561 463.652 809.214 454.187C789.868 444.723 774.836 431.5 764.118 414.52C753.401 397.4 748.043 377.497 748.043 354.81V152.922H813.599V349.381C813.599 361.212 816.243 371.79 821.532 381.115C826.821 390.302 834.198 397.539 843.663 402.828C853.127 407.978 864.192 410.553 876.858 410.553C889.663 410.553 900.798 407.978 910.262 402.828C919.727 397.539 927.034 390.302 932.184 381.115C937.473 371.79 940.118 361.212 940.118 349.381V152.922ZM1107.97 152.922L1170.61 258.981H1173.11L1235.95 152.922H1310.28L1215.29 308.67L1312.58 464H1236.58L1173.11 357.941H1170.61L1106.72 464H1031.56L1128.85 308.67L1033.23 152.922H1107.97ZM1401.1 152.922V464H1336.59V152.922H1401.1ZM1545.57 468.593C1521.63 468.593 1500.96 463.722 1483.56 453.979C1466.17 444.236 1452.8 430.387 1443.48 412.432C1434.29 394.338 1429.7 372.973 1429.7 348.337C1429.7 324.398 1434.29 303.381 1443.48 285.287C1452.8 267.193 1465.89 253.065 1482.73 242.905C1499.71 232.744 1519.61 227.664 1542.44 227.664C1557.89 227.664 1572.29 230.17 1585.66 235.18C1599.02 240.052 1610.71 247.428 1620.73 257.311C1630.75 267.054 1638.55 279.371 1644.11 294.264C1649.68 309.018 1652.47 326.346 1652.47 346.25V363.787H1455.38V323.911H1621.15L1591.08 334.349C1591.08 322.519 1589.28 312.219 1585.66 303.45C1582.04 294.682 1576.61 287.931 1569.37 283.199C1562.27 278.328 1553.44 275.892 1542.86 275.892C1532.28 275.892 1523.3 278.328 1515.92 283.199C1508.69 288.07 1503.12 294.682 1499.22 303.033C1495.33 311.384 1493.38 320.988 1493.38 331.844V360.029C1493.38 372.695 1495.6 383.551 1500.06 392.598C1504.51 401.506 1510.71 408.396 1518.64 413.267C1526.71 417.999 1535.97 420.366 1546.41 420.366C1553.64 420.366 1560.19 419.322 1566.03 417.234C1571.88 415.146 1576.89 412.084 1581.06 408.048C1585.38 404.011 1588.58 399.14 1590.67 393.433L1650.38 397.4C1647.45 411.736 1641.33 424.263 1632.01 434.98C1622.82 445.558 1610.92 453.84 1596.3 459.824C1581.69 465.67 1564.78 468.593 1545.57 468.593ZM1744.74 329.13V464H1680.23V230.587H1743.7V272.134H1746C1751.29 258.354 1759.71 247.498 1771.26 239.565C1782.81 231.631 1797.29 227.664 1814.69 227.664C1830.83 227.664 1844.89 231.213 1856.86 238.312C1868.97 245.41 1878.36 255.501 1885.04 268.585C1891.72 281.668 1895.06 297.326 1895.06 315.559V464H1830.55V327.042C1830.55 312.845 1826.86 301.711 1819.49 293.638C1812.11 285.426 1801.95 281.32 1789.01 281.32C1780.38 281.32 1772.72 283.269 1766.04 287.166C1759.36 290.924 1754.14 296.352 1750.38 303.45C1746.62 310.549 1744.74 319.109 1744.74 329.13ZM2127.02 297.187L2067.93 300.736C2066.4 293.359 2062.29 287.027 2055.61 281.738C2048.93 276.309 2039.96 273.595 2028.68 273.595C2018.66 273.595 2010.24 275.683 2003.42 279.859C1996.74 284.034 1993.4 289.601 1993.4 296.561C1993.4 302.128 1995.56 306.93 1999.87 310.966C2004.32 314.864 2011.91 317.926 2022.63 320.153L2065.01 328.504C2087.7 333.097 2104.61 340.543 2115.74 350.843C2126.88 361.142 2132.44 374.713 2132.44 391.554C2132.44 407.004 2127.99 420.505 2119.08 432.057C2110.17 443.47 2097.93 452.448 2082.34 458.989C2066.75 465.392 2048.86 468.593 2028.68 468.593C1997.78 468.593 1973.15 462.121 1954.77 449.177C1936.54 436.233 1925.89 418.695 1922.83 396.565L1986.09 393.225C1988.18 402.689 1992.91 409.857 2000.29 414.729C2007.66 419.6 2017.13 422.036 2028.68 422.036C2039.96 422.036 2049.07 419.809 2056.03 415.355C2063.13 410.901 2066.68 405.264 2066.68 398.444C2066.68 386.892 2056.66 379.097 2036.62 375.061L1996.32 366.71C1973.63 362.117 1956.72 354.253 1945.59 343.118C1934.45 331.983 1928.89 317.717 1928.89 300.319C1928.89 285.287 1932.99 272.343 1941.2 261.486C1949.42 250.63 1960.9 242.279 1975.65 236.433C1990.55 230.587 2007.94 227.664 2027.85 227.664C2057.35 227.664 2080.53 233.928 2097.37 246.454C2114.35 258.842 2124.23 275.753 2127.02 297.187Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Header() {

  return (
    <>
      <header className="w-full border-b sticky top-0 z-50 backdrop-blur-md" style={{ borderColor: "rgba(0,0,0,0.05)", background: "oklch(1 0 0 / 88%)" }}>
        <nav aria-label="Main navigation" className="mx-auto flex h-14 max-w-[960px] items-center justify-between px-7">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-70"
              aria-label="UXLens — Home"
            >
              <Logo height={22} />
            </Link>
            <Link
              href="/pricing"
              className="text-[12px] font-medium text-foreground/40 hover:text-foreground/70 transition-colors duration-150"
            >
              Pricing
            </Link>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="text-[12px] font-medium text-foreground/40 hover:text-foreground/70 transition-colors duration-150"
              >
                Dashboard
              </Link>
            </Show>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[12px] font-bold border rounded-full px-2.5 py-0.5 tracking-wider" style={{ color: "#16a34a", background: "#f0fdf4", borderColor: "#bbf7d0" }}>
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: "#16a34a", animation: "blink-dot 1.8s ease-in-out infinite" }} />
              v0.6
            </div>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="text-[12px] font-medium px-3.5 py-1.5 rounded-lg border transition-all duration-150 hover:opacity-80" style={{ borderColor: "var(--brand-glow)", color: "var(--brand)", background: "var(--brand-dim)" }}>
                  Sign In
                </button>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              <PlanBadge />
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-[32px] h-[32px]",
                  },
                }}
              />
            </Show>
          </div>
        </nav>

      </header>
    </>
  );
}
