// app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET() {
  // lets you open /api/ask in a browser and see something
  return NextResponse.json({ ok: true, use: "POST with { message }" });
}

export async function POST(req: NextRequest) {
  const { message = "", province = "AB" } = await req.json();

  // simple FAQ first
  const m = message.toLowerCase();
  if (/(afford|expensive|cost|cheap|price)/.test(m)) {
    return NextResponse.json({
      type: "faq",
      text:
        "💊 Ways to lower medication costs:\n" +
        "• Use generics (same medicine, lower price)\n" +
        "• Ask about Special Authorization (SA)\n" +
        "• Check Special Support (SS)\n" +
        "• Consider Non-Group Coverage\n" +
        "Next step: ask your pharmacist to run a test claim."
    });
  }

  // fallback to GPT (requires OPENAI_API_KEY in .env.local)
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const completion = await client.chat.completions.create({
    model: "gpt-5-nano",
    messages: [
      { role: "system", content: "You are a Canadian pharmacy access guide. No diagnosis. End with 'Next step: …'." },
      { role: "user", content: `Province: ${province}\nUser: ${message}` }
    ]
  });

  const text = completion.choices[0]?.message?.content ?? "Sorry, I couldn't generate a reply.";
  return NextResponse.json({ type: "ai", text });
}
