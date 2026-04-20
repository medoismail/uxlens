import { NextResponse } from "next/server";
import { resolveClerkUserId } from "@/lib/extension-auth";
import { getUserByClerkId } from "@/lib/db/users";
import { getSupabase } from "@/lib/supabase";

export const maxDuration = 30;

/**
 * POST /api/extension/screenshot
 * Accepts a base64 screenshot captured by the extension and uploads to Supabase.
 * Links the screenshot to an audit record.
 * Auth: Bearer token (Clerk session token).
 */
export async function POST(request: Request) {
  const clerkUserId = await resolveClerkUserId(request);
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { screenshot, auditId } = body as { screenshot?: string; auditId?: string };

  if (!screenshot || typeof screenshot !== "string") {
    return NextResponse.json({ error: "Missing screenshot data" }, { status: 400 });
  }

  if (!auditId || typeof auditId !== "string") {
    return NextResponse.json({ error: "Missing auditId" }, { status: 400 });
  }

  // Validate base64 — should be raw base64 without data URL prefix
  const base64Clean = screenshot.replace(/^data:image\/\w+;base64,/, "");

  // Size check: max 10MB base64 (~7.5MB image)
  if (base64Clean.length > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Screenshot too large (max 10MB)" }, { status: 413 });
  }

  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }

  try {
    const dbUser = await getUserByClerkId(clerkUserId);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user owns the audit
    const { data: audit } = await sb
      .from("audits")
      .select("id, user_id")
      .eq("id", auditId)
      .eq("user_id", dbUser.id)
      .single();

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Convert base64 to buffer and upload
    const buffer = Buffer.from(base64Clean, "base64");
    const filename = `ext-${Date.now()}-${auditId.slice(0, 8)}.jpg`;

    const { error: uploadError } = await sb.storage
      .from("screenshots")
      .upload(filename, buffer, {
        contentType: "image/jpeg",
        cacheControl: "31536000",
      });

    if (uploadError) {
      console.error("[Extension Screenshot] Upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { data: publicUrl } = sb.storage
      .from("screenshots")
      .getPublicUrl(filename);

    const screenshotUrl = publicUrl.publicUrl;

    // Update audit record with screenshot path
    await sb
      .from("audits")
      .update({ screenshot_path: screenshotUrl })
      .eq("id", auditId)
      .eq("user_id", dbUser.id);

    return NextResponse.json({ screenshotUrl });
  } catch (err) {
    console.error("[Extension Screenshot] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
