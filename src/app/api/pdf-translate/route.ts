import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * POST /api/pdf-translate
 * Translates audit result text fields to English for PDF export.
 * Used when the audit contains Arabic/RTL content that @react-pdf/renderer
 * cannot render correctly.
 */
export async function POST(request: Request) {
  try {
    const { data } = await request.json();
    if (!data) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a professional translator. You will receive a JSON object containing a UX audit report that may have text in Arabic or another non-English language. Translate ALL text string values to English while keeping the exact same JSON structure, keys, numbers, booleans, and arrays intact. Do NOT translate or modify:
- JSON keys/property names
- Numbers and scores
- URLs
- Severity levels (critical, high, medium, low)
- Category labels that are already in English

Return the complete translated JSON object. Keep translations professional and accurate for a UX audit context.`,
        },
        {
          role: "user",
          content: JSON.stringify(data),
        },
      ],
      max_tokens: 16384,
    });

    const translated = JSON.parse(result.choices[0].message.content || "{}");
    return NextResponse.json({ data: translated });
  } catch (error) {
    console.error("PDF translate error:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
