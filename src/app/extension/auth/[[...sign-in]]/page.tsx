"use client";

import { Suspense, useEffect, useState } from "react";
import { useUser, SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ExtensionAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "#4C2CFF", borderTopColor: "transparent" }} />
        </div>
      }
    >
      <ExtensionAuthContent />
    </Suspense>
  );
}

function ExtensionAuthContent() {
  const { isSignedIn, user } = useUser();
  const searchParams = useSearchParams();
  const extId = searchParams.get("ext_id");
  const [tokenSent, setTokenSent] = useState(false);
  const [status, setStatus] = useState<"signing-in" | "sending-token" | "done" | "no-extension">("signing-in");

  useEffect(() => {
    if (!isSignedIn || tokenSent) return;

    async function sendTokenToExtension() {
      try {
        setStatus("sending-token");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const token = await (window as any).Clerk?.session?.getToken();
        if (!token) {
          setStatus("no-extension");
          return;
        }

        // Post message for the extension's content script (auth-bridge.ts)
        window.postMessage({ type: "UXLENS_EXT_AUTH_TOKEN", token }, window.location.origin);

        setTokenSent(true);
        setStatus("done");

        // Auto-close after a short delay if opened by extension
        if (extId) {
          setTimeout(() => {
            window.close();
          }, 2000);
        }
      } catch (err) {
        console.error("Failed to get session token:", err);
        setStatus("no-extension");
      }
    }

    const timer = setTimeout(sendTokenToExtension, 500);
    return () => clearTimeout(timer);
  }, [isSignedIn, tokenSent, extId]);

  // Connected successfully
  if (isSignedIn && status === "done") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "oklch(0.504 0.282 276.1 / 10%)" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#4C2CFF" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-1">Connected!</h2>
          <p className="text-sm text-foreground/40 mb-1">
            Signed in as {user?.primaryEmailAddress?.emailAddress}
          </p>
          <p className="text-xs text-foreground/30">
            This tab will close automatically. You can now use the extension.
          </p>
        </div>
      </div>
    );
  }

  // Sending token
  if (isSignedIn && status === "sending-token") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "#4C2CFF", borderTopColor: "transparent" }} />
          <p className="text-sm text-foreground/40">Connecting extension...</p>
        </div>
      </div>
    );
  }

  // Signed in but extension not detected
  if (isSignedIn && status === "no-extension") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "oklch(0.504 0.282 276.1 / 10%)" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#4C2CFF" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-1">Signed in!</h2>
          <p className="text-sm text-foreground/40 mb-4">
            You&apos;re logged in as {user?.primaryEmailAddress?.emailAddress}.
            Open the extension popup to start auditing.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white rounded-lg"
            style={{ background: "#4C2CFF" }}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Sign-in form
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-4">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold mb-1">Sign in to UXLens</h2>
        <p className="text-sm text-foreground/40">
          Connect your account to the Chrome extension
        </p>
      </div>

      <SignIn />
    </div>
  );
}
