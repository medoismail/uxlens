import { API_BASE } from "../../lib/constants";

interface AuthViewProps {
  onSignIn: () => void;
}

export function AuthView({ onSignIn }: AuthViewProps) {
  return (
    <div className="text-center py-4">
      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-uxlens-accent/10 border border-uxlens-accent/20 flex items-center justify-center">
        <span className="text-lg font-bold text-uxlens-accent">UX</span>
      </div>

      <h2 className="text-sm font-semibold mb-1">AI UX Audit</h2>
      <p className="text-xs text-uxlens-muted mb-4 px-4 leading-relaxed">
        Run a 10-layer diagnostic on any page with one click.
        Sign in to save audits and track usage.
      </p>

      <button
        onClick={onSignIn}
        className="w-full py-2.5 text-sm font-medium bg-uxlens-accent hover:bg-uxlens-accent-hover text-white rounded-lg transition-colors"
      >
        Sign in to UXLens
      </button>

      <a
        href={`${API_BASE}/pricing`}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-2 text-[11px] text-uxlens-muted hover:text-uxlens-text transition-colors"
      >
        View plans & pricing
      </a>
    </div>
  );
}
