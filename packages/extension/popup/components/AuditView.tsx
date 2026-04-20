import { PLAN_LIMITS } from "../../lib/constants";
import type { UserInfo } from "../../lib/types";

interface AuditViewProps {
  user: UserInfo;
  currentUrl: string;
  onStartAudit: () => void;
}

export function AuditView({ user, currentUrl, onStartAudit }: AuditViewProps) {
  const limit = PLAN_LIMITS[user.plan] || 5;
  const remaining = Math.max(0, limit - user.auditsUsed);
  const isValidUrl = currentUrl.startsWith("http://") || currentUrl.startsWith("https://");
  let isRestrictedUrl = false;
  let restrictedReason = "Browser page (not auditable)";
  if (
    currentUrl.startsWith("chrome://") ||
    currentUrl.startsWith("chrome-extension://") ||
    currentUrl.startsWith("about:") ||
    currentUrl.startsWith("edge://")
  ) {
    isRestrictedUrl = true;
    restrictedReason = "Browser page (not auditable)";
  } else {
    try {
      const h = new URL(currentUrl).hostname.toLowerCase();
      if (h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || h === "[::1]") {
        isRestrictedUrl = true;
        restrictedReason = "Localhost (not auditable)";
      }
    } catch { /* invalid URL */ }
  }
  const canAudit = isValidUrl && !isRestrictedUrl && remaining > 0;

  // Truncate URL for display
  let displayUrl = "";
  try {
    const parsed = new URL(currentUrl);
    displayUrl = parsed.hostname + (parsed.pathname !== "/" ? parsed.pathname : "");
    if (displayUrl.length > 40) displayUrl = displayUrl.slice(0, 40) + "...";
  } catch {
    displayUrl = currentUrl.slice(0, 40);
  }

  const planLabel = user.plan.charAt(0).toUpperCase() + user.plan.slice(1);
  const planColor =
    user.plan === "agency"
      ? "text-amber-400"
      : user.plan === "pro"
      ? "text-uxlens-accent"
      : user.plan === "starter"
      ? "text-emerald-400"
      : "text-uxlens-muted";

  return (
    <div>
      {/* Plan badge + usage */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className={`text-xs font-medium ${planColor}`}>{planLabel}</span>
        <span className="text-[11px] text-uxlens-muted">
          {user.auditsUsed}/{limit} audits this month
        </span>
      </div>

      {/* URL display */}
      <div className="bg-uxlens-card border border-uxlens-border rounded-lg px-3 py-2.5 mb-3">
        <div className="text-[10px] text-uxlens-muted mb-0.5 uppercase tracking-wider">
          Current page
        </div>
        <div className="text-xs text-uxlens-text truncate font-mono">
          {isRestrictedUrl ? (
            <span className="text-uxlens-muted italic">{restrictedReason}</span>
          ) : isValidUrl ? (
            displayUrl
          ) : (
            <span className="text-uxlens-muted italic">No page loaded</span>
          )}
        </div>
      </div>

      {/* Audit button */}
      <button
        onClick={onStartAudit}
        disabled={!canAudit}
        className={`w-full py-2.5 text-sm font-medium rounded-lg transition-all ${
          canAudit
            ? "bg-uxlens-accent hover:bg-uxlens-accent-hover text-white"
            : "bg-uxlens-card text-uxlens-muted cursor-not-allowed border border-uxlens-border"
        }`}
      >
        {remaining <= 0 ? "No audits remaining" : "Audit This Page"}
      </button>

      {/* Usage warning */}
      {remaining > 0 && remaining <= 3 && (
        <p className="text-[10px] text-uxlens-warning mt-2 text-center">
          {remaining} audit{remaining > 1 ? "s" : ""} remaining this month
        </p>
      )}

      {remaining <= 0 && (
        <p className="text-[10px] text-uxlens-muted mt-2 text-center">
          Upgrade your plan for more audits
        </p>
      )}
    </div>
  );
}
