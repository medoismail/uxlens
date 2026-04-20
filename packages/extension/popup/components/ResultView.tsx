import { API_BASE } from "../../lib/constants";
import type { AuditResult } from "../../lib/types";

interface ResultViewProps {
  result: AuditResult;
}

export function ResultView({ result }: ResultViewProps) {
  const { overallScore, grade, executiveSummary, auditId } = result;

  // Score ring calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (overallScore / 100) * circumference;

  const scoreColor =
    overallScore >= 80
      ? "#22c55e"
      : overallScore >= 60
      ? "#f59e0b"
      : overallScore >= 40
      ? "#f97316"
      : "#ef4444";

  const gradeColor =
    grade.startsWith("A")
      ? "text-green-400"
      : grade.startsWith("B")
      ? "text-yellow-400"
      : grade.startsWith("C")
      ? "text-orange-400"
      : "text-red-400";

  return (
    <div>
      {/* Score display */}
      <div className="flex items-center gap-4 mb-3">
        <div className="relative w-[96px] h-[96px] flex-shrink-0">
          <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
            {/* Background ring */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke="#1e1e1e"
              strokeWidth="6"
            />
            {/* Score ring */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="score-ring"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold">{overallScore}</span>
            <span className="text-[10px] text-uxlens-muted">/100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-xs text-uxlens-muted">Grade</span>
            <span className={`text-2xl font-bold ${gradeColor}`}>{grade}</span>
          </div>
          <p className="text-[11px] text-uxlens-muted leading-relaxed line-clamp-3">
            {executiveSummary.slice(0, 120)}
            {executiveSummary.length > 120 ? "..." : ""}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      {auditId && (
        <a
          href={`${API_BASE}/audit/${auditId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-2.5 text-sm font-medium bg-uxlens-accent hover:bg-uxlens-accent-hover text-white rounded-lg transition-colors"
        >
          View Full Report
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}

      {!auditId && (
        <p className="text-[10px] text-uxlens-muted text-center mt-2">
          Sign in to save and view full reports
        </p>
      )}
    </div>
  );
}
