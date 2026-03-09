import { NextResponse } from "next/server";
import { getRedis } from "@/lib/server-usage";

const KEY = "uxlens:views:total";

export async function POST() {
  try {
    const r = getRedis();
    if (!r) return NextResponse.json({ count: 0 });

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
