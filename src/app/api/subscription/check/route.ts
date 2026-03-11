import { NextResponse } from "next/server";
import { z } from "zod";
import { checkSubscriptionByEmail } from "@/lib/gumroad";
import { getRedis } from "@/lib/server-usage";

const requestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/** Verify subscription status by email via Gumroad API */
export async function POST(request: Request) {
  try {
    // Rate limit: 5 requests per IP per minute
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const r = getRedis();
    if (r) {
      const rateKey = `uxlens:subcheck:${ip}`;
      const count = ((await r.get<number>(rateKey)) || 0);
      if (count >= 5) {
        return NextResponse.json(
          { error: "Too many requests. Please wait a minute." },
          { status: 429 }
        );
      }
      await r.incr(rateKey);
      await r.expire(rateKey, 60);
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid email" },
        { status: 400 }
      );
    }

    const status = await checkSubscriptionByEmail(parsed.data.email);

    return NextResponse.json({
      isActive: status.isActive,
      plan: status.plan,
      currentPeriodEnd: status.currentPeriodEnd,
    });
  } catch (error) {
    console.error("Subscription check error:", error);
    return NextResponse.json(
      { error: "Failed to check subscription status" },
      { status: 500 }
    );
  }
}
