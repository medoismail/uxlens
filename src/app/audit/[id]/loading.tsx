export default function AuditLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-14 border-b" style={{ borderColor: "var(--border)" }} />
      <main className="flex-1 mx-auto w-full max-w-[960px] px-7 py-10">
        <div className="flex flex-col items-center gap-4 py-20">
          <div
            className="h-20 w-20 rounded-2xl animate-pulse"
            style={{ background: "var(--s3)" }}
          />
          <div className="h-4 w-48 rounded animate-pulse" style={{ background: "var(--s3)" }} />
          <div className="h-3 w-32 rounded animate-pulse" style={{ background: "var(--s3)" }} />
        </div>
      </main>
    </div>
  );
}
