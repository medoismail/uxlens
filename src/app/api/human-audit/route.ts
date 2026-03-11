import { NextResponse } from "next/server";

/**
 * POST /api/human-audit
 * Sends a human audit request email to the team.
 * Uses Resend API (no npm package — direct HTTP call).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, email } = body;

    if (!url || !email) {
      return NextResponse.json(
        { error: "Missing url or email" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error("Missing RESEND_API_KEY");
      // Still return success to user — log for debugging
      console.log("[Human Audit Request]", { url, email });
      return NextResponse.json({ success: true });
    }

    let domain = url;
    try {
      domain = new URL(url).hostname.replace("www.", "");
    } catch {
      // use raw url
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "UXLens <noreply@uxlens.pro>",
        to: "hi@medoismail.design",
        subject: `Human Audit Request — ${domain}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 0;">
            <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 24px;">New Human Audit Request</h2>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 12px 16px; border: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 100px;">Website</td>
                <td style="padding: 12px 16px; border: 1px solid #e5e7eb; font-size: 14px; font-weight: 600;">
                  <a href="${url}" style="color: #4C2CFF; text-decoration: none;">${url}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Email</td>
                <td style="padding: 12px 16px; border: 1px solid #e5e7eb; font-size: 14px; font-weight: 600;">
                  <a href="mailto:${email}" style="color: #4C2CFF; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Date</td>
                <td style="padding: 12px 16px; border: 1px solid #e5e7eb; font-size: 14px;">${new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}</td>
              </tr>
            </table>

            <p style="font-size: 13px; color: #9ca3af; margin: 0;">Sent from UXLens</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend API error:", res.status, errorText);
      // Still return success — we don't want to show error to user
    }

    console.log("[Human Audit Request] Sent", { url, email });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Human audit request error:", error);
    return NextResponse.json(
      { error: "Failed to send request" },
      { status: 500 }
    );
  }
}
