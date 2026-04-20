import { API_BASE } from "../lib/constants";
import type { UserInfo } from "../lib/types";

const USER_KEY = "uxlens_user_info";

/** Cache user info locally */
async function cacheUserInfo(info: UserInfo): Promise<void> {
  await chrome.storage.local.set({ [USER_KEY]: info });
}

/** Get cached user info (fast, may be stale) */
async function getCachedUserInfo(): Promise<UserInfo | null> {
  const result = await chrome.storage.local.get(USER_KEY);
  return result[USER_KEY] || null;
}

/** Clear cached user info on sign out */
export async function clearAuth(): Promise<void> {
  await chrome.storage.local.remove([USER_KEY]);
}

/**
 * Fetch user info from the API using cookies.
 *
 * Because the extension has host_permissions for uxlens.pro,
 * Chrome automatically includes the user's cookies when the
 * service worker makes fetch requests to that domain.
 * No token storage needed — if the user is signed in to uxlens.pro,
 * the extension is authenticated.
 */
export async function fetchUserInfo(): Promise<UserInfo | null> {
  try {
    const res = await fetch(`${API_BASE}/api/extension/auth`, {
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status === 401) {
        await clearAuth();
        return null;
      }
      return getCachedUserInfo();
    }

    const data = await res.json();
    const info: UserInfo = {
      userId: data.userId,
      email: data.email,
      plan: data.plan,
      auditsUsed: data.auditsUsed,
      monthlyLimit: data.monthlyLimit,
    };

    await cacheUserInfo(info);
    return info;
  } catch {
    return getCachedUserInfo();
  }
}

/**
 * Launch sign-in by opening the UXLens welcome page in a new tab.
 * User signs in with Clerk there (sets cookies on uxlens.pro).
 * When the tab closes, the extension can authenticate via cookies.
 */
export async function launchSignIn(): Promise<UserInfo | null> {
  const authUrl = `${API_BASE}/extension/welcome`;

  return new Promise((resolve) => {
    chrome.tabs.create({ url: authUrl, active: true }, (tab) => {
      if (!tab?.id) {
        resolve(null);
        return;
      }

      const tabId = tab.id;

      // Poll for auth status while the tab is open
      const pollInterval = setInterval(async () => {
        const info = await fetchUserInfo();
        if (info) {
          clearInterval(pollInterval);
          chrome.tabs.onRemoved.removeListener(onTabClosed);
          // Close the auth tab
          chrome.tabs.remove(tabId).catch(() => {});
          resolve(info);
        }
      }, 2000);

      // If the tab is closed, check one more time
      function onTabClosed(closedId: number) {
        if (closedId === tabId) {
          clearInterval(pollInterval);
          chrome.tabs.onRemoved.removeListener(onTabClosed);
          // Give cookies a moment to propagate, then check
          setTimeout(async () => {
            const info = await fetchUserInfo();
            resolve(info);
          }, 500);
        }
      }

      chrome.tabs.onRemoved.addListener(onTabClosed);

      // Safety timeout: stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        chrome.tabs.onRemoved.removeListener(onTabClosed);
      }, 5 * 60 * 1000);
    });
  });
}
