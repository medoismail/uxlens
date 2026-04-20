import { useEffect, useState, useCallback } from "react";
import { AuthView } from "./components/AuthView";
import { AuditView } from "./components/AuditView";
import type { UserInfo } from "../lib/types";

type View = "loading" | "auth" | "ready" | "capturing" | "error";

export function App() {
  const [view, setView] = useState<View>("loading");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [error, setError] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [captureStage, setCaptureStage] = useState("");

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) setCurrentUrl(tabs[0].url);
    });
  }, []);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_AUTH_STATUS" }, (response) => {
      if (response?.data) {
        setUser(response.data);
        setView("ready");
      } else {
        setView("auth");
      }
    });
  }, []);

  // Listen for capture status from background
  useEffect(() => {
    function handleMessage(message: Record<string, unknown>) {
      switch (message.type) {
        case "AUDIT_CAPTURING":
          setCaptureStage("Reading page...");
          break;
        case "AUDIT_UPLOADING":
          setCaptureStage("Preparing audit...");
          break;
        case "AUDIT_LAUNCHED":
          // Audit page opened — close popup
          window.close();
          break;
        case "AUDIT_ERROR":
          setError(message.error as string);
          setView("error");
          break;
      }
    }
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const handleSignIn = useCallback(() => {
    setView("loading");
    chrome.runtime.sendMessage({ type: "SIGN_IN" }, (response) => {
      if (response?.data) {
        setUser(response.data);
        setView("ready");
      } else {
        setView("auth");
      }
    });
  }, []);

  const handleSignOut = useCallback(() => {
    chrome.runtime.sendMessage({ type: "SIGN_OUT" });
    setUser(null);
    setView("auth");
  }, []);

  const handleStartAudit = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return;
      setView("capturing");
      setCaptureStage("Capturing page...");
      setError("");
      chrome.runtime.sendMessage({ type: "START_AUDIT", tabId });
    });
  }, []);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-uxlens-accent flex items-center justify-center">
            <span className="text-xs font-bold text-white">UX</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">UXLens</span>
        </div>
        {user && (
          <button
            onClick={handleSignOut}
            className="text-[11px] text-uxlens-muted hover:text-uxlens-text transition-colors"
          >
            Sign out
          </button>
        )}
      </div>

      {/* Loading */}
      {view === "loading" && (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-uxlens-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Auth */}
      {view === "auth" && <AuthView onSignIn={handleSignIn} />}

      {/* Ready to audit */}
      {view === "ready" && (
        <AuditView
          user={user!}
          currentUrl={currentUrl}
          onStartAudit={handleStartAudit}
        />
      )}

      {/* Capturing */}
      {view === "capturing" && (
        <div className="text-center py-6">
          <div className="w-8 h-8 border-2 border-uxlens-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-uxlens-muted">{captureStage}</p>
          <p className="text-[10px] text-uxlens-muted/50 mt-1">
            Opening audit page...
          </p>
        </div>
      )}

      {/* Error */}
      {view === "error" && (
        <div className="text-center py-4">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-uxlens-error/10 flex items-center justify-center">
            <span className="text-uxlens-error text-lg">!</span>
          </div>
          <p className="text-xs text-uxlens-muted mb-3 px-2">{error}</p>
          <button
            onClick={() => setView("ready")}
            className="px-4 py-2 text-xs font-medium bg-uxlens-accent hover:bg-uxlens-accent-hover text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
