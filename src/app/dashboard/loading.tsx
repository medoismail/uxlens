export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-14 border-b" style={{ borderColor: "var(--border)" }} />
      <main className="flex-1 w-full max-w-[960px] mx-auto px-7 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-5 w-32 rounded animate-pulse" style={{ background: "var(--s3)" }} />
            <div className="h-3 w-20 rounded mt-2 animate-pulse" style={{ background: "var(--s3)" }} />
          </div>
          <div className="h-9 w-24 rounded-lg animate-pulse" style={{ background: "var(--s3)" }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border p-4 animate-pulse"
              style={{ borderColor: "var(--border)", background: "var(--s1)" }}
            >
              <div className="h-28 rounded-lg mb-3" style={{ background: "var(--s3)" }} />
              <div className="h-4 w-3/4 rounded" style={{ background: "var(--s3)" }} />
              <div className="h-3 w-1/2 rounded mt-3" style={{ background: "var(--s3)" }} />
              <div className="h-8 w-16 rounded mt-4" style={{ background: "var(--s3)" }} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
