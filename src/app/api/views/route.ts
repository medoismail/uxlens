import { NextResponse } from "next/server";
import { getRedis } from "@/lib/server-usage";

const KEY = "uxlens:views:total";

export async function POST(request: Request) {
  try {
    const r = getRedis();
    if (!r) return NextResponse.json({ count: 0 });

    // Rate limit: max 30 view increments per IP per hour
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateKey = `uxlens:views:rate:${ip}`;
    const rateCount = (await r.get<number>(rateKey)) || 0;
    if (rateCount >= 30) {
      const current = (await r.get<number>(KEY)) ?? 0;
      return NextResponse.json({ count: current });
    }
    await r.incr(rateKey);
    await r.expire(rateKey, 3600);

    const count = await r.incr(KEY);
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

export async function GET() {
  try {
    const r = getRedis();
    if (!r) return NextResponse.json({ count: 0 });

    const count = (await r.get<number>(KEY)) ?? 0;
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
