// app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { FAQ, FaqId, FAQ_IDS } from "./faq";

const SYSTEM_PROMPT = `
You are a Canadian pharmacy access guide specialized in the province of Alberta.
You ONLY give advice relevant to Alberta residents — Alberta Health, Blue Cross, NIHB (if applicable), seniors programs, special authorization, and local pharmacy logistics.
Focus on logistics, coverage, and how to access services. Do NOT provide diagnosis or medical judgement.
Write in a short, simple, friendly tone.
AVOID BOLD TEXT AT ALL COSTS. If the user seems unsure about speaking to pharmacy staff, offer a short one-sentence script they can say.
Give clear next steps and avoid long paragraphs.
`.trim();

// Small helper: classify a question into a FAQ id, or "none"
async function classifyToFaqId(
  client: OpenAI,
  question: string
): Promise<FaqId | "none"> {
  const system = `
You are a router for a Canadian pharmacy access chatbot.
You ONLY output one of these IDs, or "none":
${FAQ_IDS.join(", ")}

Pick an ID if the question clearly matches it.
If you are not confident, reply with: none
`.trim();

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      { role: "system", content: system },
      { role: "user", content: question },
    ],
  });

  const raw = (completion.choices[0]?.message?.content ?? "").trim();
  const normalized = raw.toLowerCase();

  const match = FAQ_IDS.find((id) => normalized === id.toLowerCase());
  if (!match) return "none";
  return match;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const message: string = body.message ?? "";
  const history: any[] = Array.isArray(body.history) ? body.history : [];
  const language: string = body.language ?? "en";

  if (!message.trim()) {
    return NextResponse.json(
      { text: "Please type a question." },
      { status: 400 }
    );
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  // 1) ROUTER STEP: if language is English, see if this maps to a known FAQ
  if (language === "en") {
    try {
      const faqId = await classifyToFaqId(client, message);
      if (faqId !== "none") {
        // Return the curated, pre-written answer directly (no hallucination)
        return NextResponse.json({ text: FAQ[faqId] });
      }
    } catch (e) {
      console.error("FAQ router error:", e);
      // If router fails, just fall through to normal chat
    }
  }

  // 2) FALLBACK: normal chat completion with your existing system prompt
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },

    // Keep response language consistent
    {
      role: "system",
      content: `Always reply in: ${language}. Stay in this language unless the user changes it.`,
    },

    ...history,
    { role: "user", content: message },
  ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

  try {
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

export async function GET() {
  return NextResponse.json({
    ok: true,
    use: "POST with { message, history?, language? }",
  });
}

