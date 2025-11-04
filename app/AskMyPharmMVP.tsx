"use client";

import { useState } from "react";

export default function AskMyPharmMVP() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "system", content: "👋 Welcome to Ask MyPharm — your medication access helper." },
  ]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, province: "AB" }),
      });
      const data = await res.json();

      setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ There was an error. Try again later." },
      ]);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-semibold mb-4">💊 Ask MyPharm</h1>
      <div className="w-full max-w-2xl border border-gray-700 rounded-2xl p-4 bg-[#111]">
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

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
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
    </main>
  );
}
