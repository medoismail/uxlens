"use client";

import { useState, useEffect, useCallback } from "react";
import type { PlanTier } from "@/lib/types";

const STORAGE_KEY = "uxlens_subscriber_email";
const PLAN_KEY = "uxlens_subscription_plan";
const VERIFIED_KEY = "uxlens_subscription_verified";
const VERIFIED_AT_KEY = "uxlens_subscription_verified_at";
const CACHE_DURATION_MS = 60 * 60 * 1000; // Re-verify every 1 hour

interface SubscriptionState {
  isSubscribed: boolean;
  plan: PlanTier;
  email: string | null;
  isVerifying: boolean;
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    plan: "free",
    email: null,
    isVerifying: false,
  });

  // On mount, check localStorage for cached subscription
  useEffect(() => {
    const email = localStorage.getItem(STORAGE_KEY);
    const verified = localStorage.getItem(VERIFIED_KEY) === "true";
    const verifiedAt = Number(localStorage.getItem(VERIFIED_AT_KEY) || "0");
    const plan = (localStorage.getItem(PLAN_KEY) as PlanTier) || "free";
    const isCacheValid = Date.now() - verifiedAt < CACHE_DURATION_MS;

    if (email && verified && isCacheValid) {
      setState({ isSubscribed: true, plan, email, isVerifying: false });
    } else if (email) {
      // Cache expired, re-verify
      verifySubscription(email);
    }
  }, []);

  const verifySubscription = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, isVerifying: true }));

    try {
      const res = await fetch("/api/subscription/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.isActive) {
        localStorage.setItem(STORAGE_KEY, email);
        localStorage.setItem(PLAN_KEY, data.plan);
        localStorage.setItem(VERIFIED_KEY, "true");
        localStorage.setItem(VERIFIED_AT_KEY, String(Date.now()));
        setState({ isSubscribed: true, plan: data.plan, email, isVerifying: false });
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(PLAN_KEY);
        localStorage.removeItem(VERIFIED_KEY);
        localStorage.removeItem(VERIFIED_AT_KEY);
        setState({ isSubscribed: false, plan: "free", email: null, isVerifying: false });
      }
    } catch {
      // On network error, trust cache if it existed
      const cachedEmail = localStorage.getItem(STORAGE_KEY);
      const wasVerified = localStorage.getItem(VERIFIED_KEY) === "true";
      const plan = (localStorage.getItem(PLAN_KEY) as PlanTier) || "free";
      setState({
        isSubscribed: wasVerified && !!cachedEmail,
        plan: wasVerified ? plan : "free",
        email: cachedEmail,
        isVerifying: false,
      });
    }
  }, []);

  const clearSubscription = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PLAN_KEY);
    localStorage.removeItem(VERIFIED_KEY);
    localStorage.removeItem(VERIFIED_AT_KEY);
    setState({ isSubscribed: false, plan: "free", email: null, isVerifying: false });
  }, []);

  return { ...state, verifySubscription, clearSubscription };
}
