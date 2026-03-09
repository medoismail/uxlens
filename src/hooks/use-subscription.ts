"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import type { PlanTier } from "@/lib/types";

interface SubscriptionState {
  isSubscribed: boolean;
  plan: PlanTier;
  email: string | null;
  isVerifying: boolean;
}

/**
 * Hook to resolve user plan tier.
 * Signed-in users: always server-verified via /api/user/plan (no localStorage).
 * Anonymous users: always "free" — must sign in for paid features.
 */
export function useSubscription() {
  const { isSignedIn, isLoaded } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    plan: "free",
    email: null,
    isVerifying: false,
  });

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      // Authenticated user — fetch plan from server (single source of truth)
      fetchClerkPlan();
    } else {
      // Anonymous user — always free, must sign in for paid features
      setState({ isSubscribed: false, plan: "free", email: null, isVerifying: false });
    }
  }, [isSignedIn, isLoaded]);

  async function fetchClerkPlan() {
    setState((prev) => ({ ...prev, isVerifying: true }));
    try {
      const res = await fetch("/api/user/plan");
      const data = await res.json();
      const plan: PlanTier = data.plan || "free";
      setState({
        isSubscribed: plan !== "free",
        plan,
        email: null,
        isVerifying: false,
      });
    } catch {
      setState((prev) => ({ ...prev, isVerifying: false }));
    }
  }

  // Keep verifySubscription for backward compatibility but route through server
  const verifySubscription = useCallback(async (_email: string) => {
    // For paid features, users must sign in with Clerk
    // This is a no-op for anonymous users
    if (!isSignedIn) return;
    await fetchClerkPlan();
  }, [isSignedIn]);

  const clearSubscription = useCallback(() => {
    setState({ isSubscribed: false, plan: "free", email: null, isVerifying: false });
  }, []);

  return { ...state, verifySubscription, clearSubscription };
}
