import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { getUserByClerkId, upsertUser } from "@/lib/db/users";
import { getAuditById } from "@/lib/db/audits";
import { getChatCredits, incrementChatCredits, saveChatMessage } from "@/lib/db/chat";
import { PLAN_FEATURES } from "@/lib/types";
import type { PlanTier, UXAuditResult } from "@/lib/types";
import { currentUser } from "@clerk/nextjs/server";

// Allow up to 60s for streaming responses
export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Condense audit data into a compact context for the chat model.
 */
function condenseAuditContext(audit: UXAuditResult, url: string): string {
  const lines: string[] = [
    `URL: ${url}`,
    `Score: ${audit.overallScore}/100 (${audit.grade})`,
    `Summary: ${audit.executiveSummary}`,
    "",
    "Category Scores:",
  ];

  const cats = audit.categories;
  lines.push(`  Message Clarity: ${cats.messageClarity.score} — ${cats.messageClarity.note}`);
  lines.push(`  Cognitive Load: ${cats.cognitiveLoad.score} — ${cats.cognitiveLoad.note}`);
  lines.push(`  Conversion Arch.: ${cats.conversionArch.score} — ${cats.conversionArch.note}`);
  lines.push(`  Trust Signals: ${cats.trustSignals.score} — ${cats.trustSignals.note}`);
  lines.push(`  Contradictions: ${cats.contradictions.score} — ${cats.contradictions.note}`);
  lines.push(`  First Screen: ${cats.firstScreen.score} — ${cats.firstScreen.note}`);

  lines.push("", "Conversion Killers:");
  audit.conversionKillers.slice(0, 5).forEach((k, i) => lines.push(`  ${i + 1}. ${k}`));

  lines.push("", "Quick Wins:");
  audit.quickWins.slice(0, 3).forEach((w, i) => lines.push(`  ${i + 1}. ${w}`));

  if (audit.strategicFixes.length > 0) {
    lines.push("", "Strategic Fixes:");
    audit.strategicFixes.slice(0, 3).forEach((f, i) => lines.push(`  ${i + 1}. ${f}`));
  }

  // Add key section findings (top issues only)
  audit.sections.forEach((sec) => {
    const issues = sec.findings.filter((f) => f.type === "issue").slice(0, 2);
    if (issues.length > 0) {
      lines.push(``, `${sec.name} (${sec.score}/100):`);
      issues.forEach((f) => lines.push(`  - [${f.impact}] ${f.title}: ${f.desc}`));
    }
  });

  return lines.join("\n");
}

const SYSTEM_PROMPT = `You are UXLens AI, a senior UX consultant. You're helping a user understand and act on their UX audit results.

You have access to the audit data for their website. Be specific, actionable, and reference the audit findings directly. Keep responses concise (2-4 paragraphs max).

Guidelines:
- Reference specific scores, findings, and recommendations from the audit
- Give concrete, implementable advice (specific copy suggestions, layout changes, etc.)
- Prioritize by impact — focus on conversion killers first
- Use a friendly, expert tone — like a senior UX consultant in a meeting
- If asked about something not in the audit data, say so honestly
- Don't repeat the full audit — the user already has it`;

export async function POST(request: Request) {
  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json();
    const { auditId, message } = body;

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!auditId || !UUID_RE.test(auditId) || !message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Missing or invalid auditId or message" }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: "Message too long (max 2000 chars)" }, { status: 400 });
    }

    // Get or create Supabase user
    let dbUser = await getUserByClerkId(userId);
    if (!dbUser) {
      const clerkUser = await currentUser();
      if (clerkUser?.emailAddresses?.[0]?.emailAddress) {
        dbUser = await upsertUser(userId, clerkUser.emailAddresses[0].emailAddress);
      }
      if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    // Check plan allows AI chat
    const plan = (dbUser.plan || "free") as PlanTier;
    const features = PLAN_FEATURES[plan];

    if (!features.aiChat) {
      return NextResponse.json({
        error: "AI chat is available on Pro and Agency plans",
        upgradeRequired: true,
      }, { status: 403 });
    }

    // Fetch credits, audit, and chat history in parallel
    const [credits, audit, history] = await Promise.all([
      getChatCredits(dbUser.id, features.chatLimit),
      getAuditById(auditId, dbUser.id),
      (async () => {
        const { getChatHistory } = await import("@/lib/db/chat");
        return getChatHistory(auditId, dbUser.id);
      })(),
    ]);

    if (credits.messages_used >= credits.messages_limit) {
      return NextResponse.json({
        error: `Monthly chat limit reached (${credits.messages_limit} messages). Resets next month.`,
        creditsExhausted: true,
        credits,
      }, { status: 429 });
    }

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Increment credits BEFORE streaming to prevent bypass via aborted requests
    await incrementChatCredits(dbUser.id);

    // Build context
    const auditContext = condenseAuditContext(audit.result, audit.url);
    const recentHistory = history.slice(-10);

    // Build messages array
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: `${SYSTEM_PROMPT}\n\n--- AUDIT DATA ---\n${auditContext}` },
      ...recentHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message.trim() },
    ];

    // Save user message
    await saveChatMessage({
      auditId,
      userId: dbUser.id,
      role: "user",
      content: message.trim(),
    });

    // Call OpenAI with streaming
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 800,
      temperature: 0.7,
      stream: true,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    let fullResponse = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }

          // Save assistant message after stream completes
          await saveChatMessage({
            auditId,
            userId: dbUser.id,
            role: "assistant",
            content: fullResponse,
          });

          // Send done event with updated credits
          const updatedCredits = await getChatCredits(dbUser.id, features.chatLimit);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, credits: updatedCredits })}\n\n`)
          );
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
