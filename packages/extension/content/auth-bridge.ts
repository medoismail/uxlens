/**
 * Auth bridge content script — runs on uxlens.pro/extension/* pages only.
 * Listens for the auth token from the page and sends it to the background service worker.
 */

window.addEventListener("message", (event) => {
  // Only accept messages from the same origin
  if (event.origin !== window.location.origin) return;

  if (event.data?.type === "UXLENS_EXT_AUTH_TOKEN" && event.data?.token) {
    chrome.runtime.sendMessage({
      type: "UXLENS_AUTH_TOKEN",
      token: event.data.token,
    });
  }
});
