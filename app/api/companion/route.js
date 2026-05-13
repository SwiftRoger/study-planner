import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function POST(req) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { messages, taskContext } = await req.json();

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are a friendly AI Study Companion for a student using an AI-Based Study Planner system built at the National University of Management in Cambodia.

You help students with:
- Study tips and strategies
- Explaining difficult topics
- Suggesting study schedules
- Motivating and encouraging them
- Answering questions about their tasks and deadlines

${taskContext}

Important rules:
- If the student writes in Khmer, respond in Khmer
- If the student writes in English, respond in English
- Keep responses concise and helpful (max 3-4 sentences)
- Be friendly, encouraging and supportive
- You know about their tasks so reference them when relevant
- Never make up information you don't know`,
        },
        ...messages.slice(-10),
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that. Please try again!";

  return NextResponse.json({ reply });
}