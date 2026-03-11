"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Download, X, Share } from "lucide-react";

const DISMISS_KEY = "uxlens:install-dismissed";
const DISMISS_DAYS = 30;

/** Milliseconds in N days */
function daysMs(n: number) {
  return n * 24 * 60 * 60 * 1000;
}

function wasDismissedRecently(): boolean {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    return Date.now() - Number(ts) < daysMs(DISMISS_DAYS);
  } catch {
    return false;
  }
}

function setDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* noop */
  }
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768 || "ontouchstart" in window;
}

/**
 * Floating bottom-center banner prompting mobile users to install the app.
 * - Android: uses `beforeinstallprompt` → native install dialog
 * - iOS: shows tap-share instructions
 * - Desktop / already installed / dismissed: hidden
 */
export function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Listen for Android's beforeinstallprompt
  useEffect(() => {
    if (isStandalone() || wasDismissedRecently() || !isMobile()) return;

    const ios = isIOS();
    setIsIOSDevice(ios);

    // On iOS, show the banner after a short delay (no native event)
    if (ios) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }

    // On Android/Chrome, wait for the browser's install prompt event
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Also show on Android after delay even if no event fires (some browsers)
    const fallbackTimer = setTimeout(() => {
      if (!deferredPromptRef.current && isMobile() && !isIOS()) {
        // Don't show on Android if no install prompt — nothing we can do
      }
    }, 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const dismiss = useCallback(() => {
    setExiting(true);
    setDismissed();
    setTimeout(() => setVisible(false), 300);
  }, []);

  const handleInstall = useCallback(async () => {
    if (isIOSDevice) {
      setShowIOSGuide(true);
      return;
    }

    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") {
      dismiss();
    }
    deferredPromptRef.current = null;
  }, [isIOSDevice, dismiss]);

  if (!visible) return null;

  return (
    <>
      {/* Install banner */}
      <div
        className={`fixed left-1/2 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-xl transition-all duration-300 ${
          exiting
            ? "translate-y-[120%] opacity-0"
            : "translate-y-0 opacity-100"
        }`}
        style={{
          bottom: "calc(16px + var(--safe-area-bottom, 0px))",
          transform: `translateX(-50%) ${exiting ? "translateY(120%)" : "translateY(0)"}`,
          background: "oklch(0.13 0.01 285 / 85%)",
          borderColor: "var(--border2)",
          maxWidth: "calc(100vw - 32px)",
          width: "360px",
          animation: exiting ? "none" : "install-slide-up 0.4s ease-out",
        }}
      >
        {/* Icon */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
        >
          <Download className="h-5 w-5" />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-white">
            Install UXLens
          </p>
          <p className="text-[12px] text-white/50">
            Quick access from your home screen
          </p>
        </div>

        {/* Install button */}
        <button
          onClick={handleInstall}
          className="shrink-0 rounded-lg px-3.5 py-1.5 text-[12px] font-bold transition-all duration-150 hover:brightness-110 active:scale-95"
          style={{
            background: "var(--brand)",
            color: "var(--brand-fg)",
          }}
        >
          {isIOSDevice ? "How to" : "Install"}
        </button>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="shrink-0 rounded-full p-1 text-white/30 transition-colors hover:text-white/60"
          aria-label="Dismiss install banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* iOS instructions overlay */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          onClick={() => setShowIOSGuide(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Instructions card */}
          <div
            className="relative mx-4 mb-8 w-full max-w-sm rounded-2xl border p-6"
            style={{
              background: "oklch(0.15 0.01 285 / 95%)",
              borderColor: "var(--border2)",
              marginBottom: "calc(32px + var(--safe-area-bottom, 0px))",
              animation: "install-slide-up 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[15px] font-bold text-white mb-4">
              Install UXLens on iOS
            </h3>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                  style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
                >
                  1
                </div>
                <div>
                  <p className="text-[14px] text-white">
                    Tap the{" "}
                    <Share className="inline h-4 w-4 text-[#007AFF] align-text-bottom" />{" "}
                    <span className="font-medium text-white">Share</span> button in Safari
                  </p>
                  <p className="text-[12px] text-white/40 mt-0.5">
                    It&apos;s at the bottom of your screen
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                  style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
                >
                  2
                </div>
                <div>
                  <p className="text-[14px] text-white">
                    Scroll down and tap{" "}
                    <span className="font-medium text-white">&quot;Add to Home Screen&quot;</span>
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                  style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
                >
                  3
                </div>
                <div>
                  <p className="text-[14px] text-white">
                    Tap <span className="font-medium text-white">&quot;Add&quot;</span> to confirm
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSGuide(false);
                dismiss();
              }}
              className="mt-5 w-full rounded-lg py-2.5 text-[14px] font-semibold text-white/60 transition-colors hover:text-white border"
              style={{ borderColor: "var(--border)" }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Keyframe animation */}
      <style jsx global>{`
        @keyframes install-slide-up {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </>
  );
}

/**
 * TypeScript declaration for the BeforeInstallPromptEvent
 * (not in standard lib.dom.d.ts)
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
