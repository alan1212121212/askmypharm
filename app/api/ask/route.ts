// app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `
You are a Canadian pharmacy access guide. Focus on logistics and coverage, not diagnosis.
Keep responses short, plain, and friendly, similar to how pharmacy staff speak with newcomers or elderly patients.
Do not use bold text. If the user seems unsure what to say at the pharmacy, include a one-sentence script they can use.
Give clear next steps.
`.trim();

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const message: string = body.message ?? "";
  const province: string = body.province ?? "AB";
  const history: any[] = Array.isArray(body.history) ? body.history : [];

  if (!message.trim()) {
    return NextResponse.json(
      { text: "Please type a question." },
      { status: 400 }
    );
  }

  // history already has roles "user" / "assistant" from serializeHistory
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: `Province context: ${province}` },
    ...history,
    { role: "user", content: message },
  ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages,
    });

    const text =
      completion.choices?.[0]?.message?.content?.trim() ??
      "Sorry, I couldn't generate a reply.";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("API /api/ask error:", err);
    return NextResponse.json(
      { text: "There was an error. Try again later." },
      { status: 500 }
    );
  }
}

// optional: simple GET so hitting /api/ask in browser still works
export async function GET() {
  return NextResponse.json({
    ok: true,
    use: "POST with { message, province?, history? }",
  });
}
