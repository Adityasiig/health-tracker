import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getServerSupabase, requireUser } from "@/lib/db/server";
import { buildCoachContext } from "@/lib/groq/coach";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { message } = await req.json();
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY missing" }, { status: 500 });
    }

    const supabase = await getServerSupabase();
    await supabase.from("chat_log").insert({
      user_id: user.id,
      role: "user", content: message, created_at: new Date().toISOString(),
    });

    const { data: hist } = await supabase
      .from("chat_log").select("role, content")
      .order("id", { ascending: false }).limit(10);
    const history = (hist ?? []).reverse().map(h => ({
      role: h.role as "user" | "assistant", content: h.content as string,
    }));

    const context = await buildCoachContext(user.id);
    const system = `You are a friendly, knowledgeable nutrition coach helping a user track their health.
You have access to their live profile, daily intake, and recent history. Give specific, actionable advice.
Keep responses concise (2-4 sentences usually). Use plain English. When relevant, suggest specific foods
or quantities. Be encouraging but honest.

CURRENT USER STATE:
${context}`;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "system", content: system }, ...history],
      temperature: 0.7,
      max_tokens: 400,
    });
    const reply = completion.choices[0]?.message?.content?.trim() || "(no response)";

    await supabase.from("chat_log").insert({
      user_id: user.id,
      role: "assistant", content: reply, created_at: new Date().toISOString(),
    });
    return NextResponse.json({ reply });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: `AI coach unavailable: ${(e as Error).message}` }, { status: 502 });
  }
}
