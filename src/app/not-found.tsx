import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
          style={{ background: "var(--brand-dim)" }}
        >
          <span className="text-2xl" style={{ color: "var(--brand)" }}>404</span>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Page not found</h1>
        <p className="text-[13px] text-foreground/50 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="text-[13px] font-medium px-5 py-2.5 rounded-lg transition-all hover:opacity-80"
            style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="text-[13px] font-medium px-5 py-2.5 rounded-lg border transition-all hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
