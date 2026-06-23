"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { swrFetcher, api } from "@/lib/api";
import type { ChatMessage } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, Trash2, User } from "lucide-react";

const SUGGESTIONS = [
  "How much protein do I have left today?",
  "Suggest a high-protein Indian dinner under 500 kcal.",
  "Am I on track for my goal?",
  "What's a healthy snack right now?",
];

export default function CoachPage() {
  const { data: history, mutate } = useSWR<ChatMessage[]>("/api/coach/history", swrFetcher);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history]);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    setSending(true);
    setInput("");
    // optimistic
    const pending: ChatMessage[] = [
      ...(history ?? []),
      { role: "user", content: text },
    ];
    mutate(pending, { revalidate: false });
    try {
      await api.post("/api/coach/chat", { message: text });
      mutate();
    } catch (err) {
      mutate([
        ...pending,
        { role: "assistant", content: `Error: ${(err as Error).message}` },
      ], { revalidate: false });
    } finally {
      setSending(false);
    }
  };

  const clear = async () => {
    if (!confirm("Clear the entire conversation?")) return;
    await api.del("/api/coach/history");
    mutate();
  };

  const messages = history ?? [];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[860px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Coach</h1>
            <p className="text-xs text-[rgb(var(--fg-muted))]">
              <Sparkles className="inline w-3 h-3 mr-1" />
              qwen2.5:14b · knows your live profile + today&apos;s log
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clear} className="btn btn-ghost text-xs">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto glass-card p-6 space-y-4 mb-4">
        {messages.length === 0 ? (
          <EmptyState onPick={send} />
        ) : (
          <AnimatePresence>
            {messages.map((m, i) => (
              <Message key={m.id ?? i} msg={m} />
            ))}
            {sending && <ThinkingBubble />}
          </AnimatePresence>
        )}
      </div>

      <div className="glass-card p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
          placeholder="Ask anything about your nutrition…"
          disabled={sending}
          className="input border-0 flex-1 disabled:opacity-50"
        />
        <button
          onClick={() => send(input)}
          disabled={sending || !input.trim()}
          className="btn btn-primary disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Message({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
        isUser ? "bg-blue-500/10" : "gradient-bg"
      }`}>
        {isUser ? <User className="w-4 h-4 text-blue-500" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
        isUser
          ? "bg-blue-500/10 text-[rgb(var(--fg))] rounded-tr-sm"
          : "bg-[rgb(var(--border))]/30 rounded-tl-sm"
      }`}>
        {msg.content}
      </div>
    </motion.div>
  );
}

function ThinkingBubble() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
      <div className="shrink-0 w-8 h-8 rounded-xl gradient-bg flex items-center justify-center">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-[rgb(var(--border))]/30 flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--fg-muted))]"
          />
        ))}
      </div>
    </motion.div>
  );
}

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-10">
      <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mb-4">
        <Bot className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-bold mb-2">Your AI Nutrition Coach</h3>
      <p className="text-sm text-[rgb(var(--fg-muted))] max-w-sm mb-6">
        Ask me about your daily intake, goal progress, or get meal suggestions.
        I see your live data.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => onPick(s)}
            className="text-left p-3 rounded-xl border border-[rgb(var(--border))] hover:border-emerald-500/50 hover:bg-emerald-500/5 text-sm transition-all">
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
