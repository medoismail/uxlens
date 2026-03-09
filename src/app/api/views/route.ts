import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const KEY = "uxlens:views:total";

/* Direct Redis client — avoid importing from server-usage to isolate issues */
function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function POST() {
  try {
    const r = createRedis();
    if (!r) return NextResponse.json({ count: 0, debug: "no-env" });

    const count = await r.incr(KEY);
    return NextResponse.json({ count });
  } catch (e) {
    return NextResponse.json({ count: 0, debug: String(e) });
  }
}

export async function GET() {
  try {
    const r = createRedis();
    if (!r) return NextResponse.json({ count: 0, debug: "no-env" });

    const count = (await r.get<number>(KEY)) ?? 0;
    return NextResponse.json({ count });
  } catch (e) {
    return NextResponse.json({ count: 0, debug: String(e) });
  }
}
