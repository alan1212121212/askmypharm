// app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs"; // ensure Node runtime for OpenAI

const FAQ = [
  {
    match: /(afford|expensive|cost|cheap|price)/i,
    answer:
      "Ways to lower medication costs:\n" +
      "• Use generics (same medicine, lower price)\n" +
      "• Ask about Special Authorization (SA)\n" +
      "• Check Special Support (SS)\n" +
      "• Consider Non-Group Coverage\n\n" +
      "Next step: ask your pharmacist to run a test claim.",
  },
  {
    match: /(minor ailment|prescrib|uti|pink eye|cold sore|eczema)/i,
    answer:
      "Pharmacists can assess/prescribe for some minor ailments (varies by province).\n\n" +
      "Next step: ask for a 'minor ailments assessment' at the counter.",
  },
  {
    match: /(special authorization|\bsa\b|exception|not covered)/i,
    answer:
      "Special Authorization (SA) lets the provincial plan cover certain drugs after approval.\n\n" +
      "Next step: ask your pharmacist or prescriber to start the SA form.",
  },
  {
    match: /(special support|\bss\b|income|cost relief)/i,
    answer:
      "Special Support (SS) reduces out-of-pocket costs when drug expenses are high vs income (AB Blue Cross).\n\n" +
      "Next step: apply online; bring recent income info.",
  },
  {
    match: /(non[- ]?group|no insurance|no coverage)/i,
    answer:
      "Non-Group Coverage is a government drug plan you can buy if you lack private insurance.\n\n" +
      "Next step: check AB Blue Cross Non-Group details and enroll if it fits.",
  },
];

export async function GET() {
  return NextResponse.json({ ok: true, use: "POST with { message, province? }" });
}

export async function POST(req: NextRequest) {
  try {
    const { message = "", province = "AB" } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { type: "bad-request", text: "Missing or invalid 'message'." },
        { status: 200 }
      );
    }

    // Emergency guardrail
    if (/(chest pain|stroke|can't breathe|suicid|overdose|severe bleeding)/i.test(message)) {
      return NextResponse.json({
        type: "emergency",
        text:
          "This sounds urgent. If you have chest pain, trouble breathing, stroke symptoms, thoughts of self-harm, overdose, or severe bleeding: call 911 or go to the nearest emergency department now.",
      });
    }

    // Try local FAQ first
    for (const f of FAQ) {
      if (f.match.test(message)) return NextResponse.json({ type: "faq", text: f.answer });
    }

    // Fallback to GPT only if key present
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        type: "no-ai",
        text:
          "I can help with pharmacy services, insurance basics, and cost-saving options (generics, SA, Special Support, Non-Group). " +
          "Please ask about one of these topics.",
        debug: "OPENAI_API_KEY not set in Vercel env.",
      });
    }

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // change if you want
      messages: [
        {
          role: "system",
          content:
            "You are a Canadian pharmacy access guide. No diagnosis, purely logistics and general advice. Please speak casually but simply and avoid using an excess amount of text, as if you are a pharmacy staff member speaking to immigrant or elderly patients. Do not use bold text.",
        },
        { role: "user", content: `Province: ${province}\nUser: ${message}` },
      ],
      temperature: 0.3,
    });

    const text =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate a reply.";
    return NextResponse.json({ type: "ai", text });
  } catch (err: any) {
    // Always return JSON so the UI shows a friendly message
    return NextResponse.json(
      {
        type: "error",
        text: "Server error while processing your message.",
        details: err?.message ?? String(err),
      },
      { status: 200 }
    );
  }
}



