/** Capture visible tab screenshot using Chrome API */
export async function captureVisibleTab(tabId: number): Promise<string> {
  // Get the window ID for this tab
  const tab = await chrome.tabs.get(tabId);
  if (!tab.windowId) throw new Error("No window for tab");

  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
    format: "jpeg",
    quality: 85,
  });

  return dataUrl;
}

/**
 * Capture full page by scrolling.
 * Sends message to content script to get dimensions and scroll,
 * then stitches captures together.
 */
/** Send message to tab, injecting content script if needed */
async function sendToTab(tabId: number, message: Record<string, unknown>): Promise<unknown> {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content/capture.js"],
    });
    await new Promise((r) => setTimeout(r, 100));
    return chrome.tabs.sendMessage(tabId, message);
  }
}

export async function captureFullPage(tabId: number): Promise<string> {
  // Get page dimensions from content script
  const dimensions = await sendToTab(tabId, {
    type: "GET_PAGE_DIMENSIONS",
  }) as { scrollHeight: number; viewportHeight: number; viewportWidth: number } | null;

  if (!dimensions) {
    // Fallback: just capture visible area
    return captureVisibleTab(tabId);
  }

  const { scrollHeight, viewportHeight } = dimensions;
  const scrollSteps = Math.ceil(scrollHeight / viewportHeight);

  // If page fits in viewport, just capture once
  if (scrollSteps <= 1) {
    return captureVisibleTab(tabId);
  }

  // Scroll to top first
  await sendToTab(tabId, { type: "SCROLL_TO", y: 0 });
  await sleep(300);

  const captures: string[] = [];

  for (let i = 0; i < scrollSteps; i++) {
    const y = i * viewportHeight;
    await sendToTab(tabId, { type: "SCROLL_TO", y });
    await sleep(250); // Wait for scroll + render

    const dataUrl = await captureVisibleTab(tabId);
    captures.push(dataUrl);
  }

  // Scroll back to top
  await sendToTab(tabId, { type: "SCROLL_TO", y: 0 });

  // If only one capture, return it directly
  if (captures.length === 1) return captures[0];

  // Stitch using offscreen document
  return stitchScreenshots(captures, dimensions.viewportWidth, scrollHeight, viewportHeight);
}

/** Use offscreen document to stitch screenshots on canvas */
async function stitchScreenshots(
  captures: string[],
  width: number,
  totalHeight: number,
  viewportHeight: number
): Promise<string> {
  // Ensure offscreen document exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });

  if (existingContexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: "offscreen/offscreen.html",
      reasons: [chrome.offscreen.Reason.BLOBS],
      justification: "Stitching full-page screenshot from multiple captures",
    });
  }

  const result = await chrome.runtime.sendMessage({
    type: "STITCH_SCREENSHOTS",
    captures,
    width,
    totalHeight,
    viewportHeight,
  });

  return result as string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
