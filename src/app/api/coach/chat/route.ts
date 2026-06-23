import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { sb } from "@/lib/db/supabase";
import { buildCoachContext } from "@/lib/groq/coach";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;  // Vercel function timeout (Hobby allows up to 60)

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY missing" }, { status: 500 });
  }

  // Store user message
  await sb.from("chat_log").insert({
    role: "user", content: message, created_at: new Date().toISOString(),
  });

  // Pull last 10 turns for context window
  const { data: hist } = await sb
    .from("chat_log").select("role, content")
    .order("id", { ascending: false }).limit(10);
  const history = (hist ?? []).reverse().map(h => ({
    role: h.role as "user" | "assistant", content: h.content as string,
  }));

  const context = await buildCoachContext();
  const system = `You are a friendly, knowledgeable nutrition coach helping a user track their health.
You have access to their live profile, daily intake, and recent history. Give specific, actionable advice.
Keep responses concise (2-4 sentences usually). Use plain English. When relevant, suggest specific foods
or quantities. Be encouraging but honest.

CURRENT USER STATE:
${context}`;

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "system", content: system }, ...history],
      temperature: 0.7,
      max_tokens: 400,
    });
    const reply = completion.choices[0]?.message?.content?.trim() || "(no response)";

    await sb.from("chat_log").insert({
      role: "assistant", content: reply, created_at: new Date().toISOString(),
    });
    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json({ error: `AI coach unavailable: ${(e as Error).message}` }, { status: 502 });
  }
}
