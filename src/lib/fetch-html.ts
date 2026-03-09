/**
 * Shared HTML fetcher for UXLens.
 * Used by /api/analyze and /api/competitor-analysis.
 *
 * Tries a bot-like UA first, then falls back to a Chrome-like UA
 * so we can fetch most public landing pages reliably.
 */

export async function fetchPageHTML(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Simple, honest bot-like headers — no fake Sec-Fetch
        "User-Agent": "Mozilla/5.0 (compatible; UXLensBot/1.0; +https://www.uxlens.pro)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.text();
  } catch (err) {
    clearTimeout(timer);

    // Fallback: try with a Chrome-like User-Agent (no Sec-Fetch headers)
    const controller2 = new AbortController();
    const timer2 = setTimeout(() => controller2.abort(), 5000);

    try {
      const res2 = await fetch(url, {
        signal: controller2.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html,*/*",
        },
        redirect: "follow",
      });

      clearTimeout(timer2);

      if (!res2.ok) {
        throw new Error(`HTTP ${res2.status}`);
      }

      return await res2.text();
    } catch (err2) {
      clearTimeout(timer2);
      // Throw the original error for better debugging
      const msg = err instanceof Error ? err.message : "Unknown error";
      const msg2 = err2 instanceof Error ? err2.message : "Unknown error";
      throw new Error(`Fetch failed (attempt 1: ${msg}, attempt 2: ${msg2})`);
    }
  }
}
