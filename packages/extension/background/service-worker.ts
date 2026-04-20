import { fetchUserInfo, launchSignIn, clearAuth } from "./auth";
import { captureFullPage } from "./screenshot";
import { API_BASE } from "../lib/constants";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "STITCH_SCREENSHOTS") return false;

  switch (message.type) {
    case "GET_AUTH_STATUS":
      fetchUserInfo().then((info) => {
        sendResponse({ type: "AUTH_STATUS", data: info });
      });
      return true;

    case "SIGN_IN":
      launchSignIn().then((info) => {
        sendResponse({ type: "AUTH_STATUS", data: info });
      });
      return true;

    case "SIGN_OUT":
      clearAuth().then(() => {
        sendResponse({ type: "AUTH_STATUS", data: null });
      });
      return true;

    case "START_AUDIT":
      handleStartAudit(message.tabId);
      sendResponse({ ok: true });
      return false;
  }

  return false;
});

/** Ensure content script is injected, then send a message */
async function sendToTab(tabId: number, message: Record<string, unknown>): Promise<unknown> {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content/capture.js"],
    });
    await new Promise((r) => setTimeout(r, 150));
    return chrome.tabs.sendMessage(tabId, message);
  }
}

async function handleStartAudit(tabId: number) {
  broadcast({ type: "AUDIT_CAPTURING" });

  try {
    // 1. Extract page content from live DOM
    const contentResponse = await sendToTab(tabId, { type: "EXTRACT_CONTENT" }) as
      { ok?: boolean; content?: Record<string, unknown>; error?: string } | null;

    if (!contentResponse?.ok || !contentResponse.content) {
      broadcast({ type: "AUDIT_ERROR", error: "Could not read page content. Try refreshing." });
      return;
    }

    // 2. Capture full-page screenshot
    let screenshot: string | null = null;
    try {
      const dataUrl = await captureFullPage(tabId);
      screenshot = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    } catch {
      // Continue without screenshot
    }

    broadcast({ type: "AUDIT_UPLOADING" });

    // 3. Upload content + screenshot, get token
    const res = await fetch(`${API_BASE}/api/extension/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        content: contentResponse.content,
        screenshot,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      broadcast({ type: "AUDIT_ERROR", error: err.error || "Upload failed" });
      return;
    }

    const { token } = await res.json();

    // 4. Open the loading page on uxlens — user sees the full 10-stage animation
    chrome.tabs.create({
      url: `${API_BASE}/extension/audit/${token}`,
      active: true,
    });

    broadcast({ type: "AUDIT_LAUNCHED" });
  } catch (err) {
    broadcast({ type: "AUDIT_ERROR", error: err instanceof Error ? err.message : "Something went wrong" });
  }
}

function broadcast(msg: Record<string, unknown>) {
  chrome.runtime.sendMessage(msg).catch(() => {});
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: `${API_BASE}/extension/welcome` });
  }
});
