"use client";
import React, { useState } from "react";

type LangDef = {
  code: string;
  label: string;
  flag: string;
  greeting: string;
  placeholder: string;
  scriptHint: string;
};

const LANGS: LangDef[] = [
  {
    code: "en",
    label: "English",
    flag: "🇨🇦",
    greeting: "Welcome to Ask MyPharm — your medication access helper.",
    placeholder: "Type your question…",
    scriptHint: "If you're nervous, I can give you a simple sentence to say at the pharmacy."
  },
  {
    code: "zh",
    label: "中文",
    flag: "🇨🇳",
    greeting: "欢迎使用 Ask MyPharm，这里帮助你了解如何取药和报销。",
    placeholder: "在这里输入你的问题…",
    scriptHint: "如果你在药房不好意思开口，我可以给你一句简单的话直接照着说。"
  }
  // add more languages here later
];

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

function serializeHistory(messages: ChatMsg[]) {
  const cleaned = messages
    // only keep user + assistant messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? "").slice(0, 800),
    }));

  // last 8 turns max
  return cleaned.slice(-8);
}

export default function AskMyPharmMVP() {
  const [langIndex, setLangIndex] = useState(0);
  const [langLocked, setLangLocked] = useState(false);
  const currentLang = LANGS[langIndex];

  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: LANGS[0].greeting },
  ]);
  const [loading, setLoading] = useState<boolean>(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim()) return;

    // lock language on first question
    if (!langLocked) {
      setLangLocked(true);
    }

    const userMsg: ChatMsg = { role: "user", content: input };
    const payload = input;
    setInput("");

    // optimistic update
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // include the new user message in history
      const history = serializeHistory([...messages, userMsg]);

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: payload,
          history,
          language: currentLang.code,
        }),
      });

      const data: { text?: string } = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.text ?? "⚠️ I couldn't generate a reply.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ There was an error. Try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-gray-100 flex flex-col items-center p-6">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-semibold">Ask MyPharm</h1>

          <div className="flex flex-col items-end gap-1 text-xs">
            <span className="text-gray-400">Language</span>
            <div className="flex flex-wrap gap-1">
              {LANGS.map((lang, i) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    if (!langLocked) setLangIndex(i);
                  }}
                  className={
                    "flex items-center gap-1 rounded-full px-2 py-1 border " +
                    (i === langIndex
                      ? "border-blue-400 bg-blue-900 text-white"
                      : "border-gray-600 bg-gray-800 text-gray-200")
                  }
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-gray-700 rounded-2xl p-4 bg-[#111]">
          <div className="h-[60vh] overflow-y-auto space-y-3 mb-3 p-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white self-end ml-auto max-w-[80%]"
                    : "bg-gray-800 text-gray-200 max-w-[90%]"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {loading && <p className="text-sm text-gray-500">Thinking...</p>}
          </div>

          <p className="text-xs text-gray-500 mb-2">
            {currentLang.scriptHint}
          </p>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentLang.placeholder}
              className="flex-1 p-3 rounded-lg bg-gray-900 text-gray-100 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
