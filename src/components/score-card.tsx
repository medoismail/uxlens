"use client";

interface ScoreCardProps {
  label: string;
  score: number;
  icon: React.ReactNode;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500/80";
  if (score >= 60) return "bg-amber-500/80";
  return "bg-red-500/80";
}

export function ScoreCard({ label, score, icon }: ScoreCardProps) {
  return (
    <div className="group rounded-xl border border-border/40 bg-card p-4 transition-all duration-200 hover:shadow-elevation-1 hover:border-border/60">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-muted-foreground/60">{icon}</span>
          <span className="text-[16px] font-medium text-foreground/80">{label}</span>
        </div>
        <span className={`text-lg font-semibold tabular-nums tracking-tight ${getScoreColor(score)}`}>
          {score}
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-foreground/[0.04]">
        <div
          className={`h-full rounded-full animate-bar-fill ${getBarColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
