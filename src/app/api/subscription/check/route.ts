import { NextResponse } from "next/server";
import { z } from "zod";
import { checkSubscriptionByEmail } from "@/lib/lemonsqueezy";

const requestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/** Verify subscription status by email via LemonSqueezy API */
export async function POST(request: Request) {
  try {
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
