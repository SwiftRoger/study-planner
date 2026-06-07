import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildSystemPrompt,
  buildBriefingPrompt,
  buildTaskContext,
  parseTaskFromResponse,
  cleanResponseText,
  normalizeDeadline,
  detectKhmer,
} from "@/lib/lucy";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

async function callGroq(messages, systemPrompt, maxTokens = 400) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.75,
      max_tokens: maxTokens,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq API error");
  return data.choices?.[0]?.message?.content || "";
}

function bestMatch(msg, taskList) {
  const m = msg.toLowerCase();
  let best = null, bestScore = 0;
  for (const t of taskList) {
    const words = [
      ...t.title.toLowerCase().split(/\s+/),
      ...t.subject.toLowerCase().split(/\s+/),
    ].filter(w => w.length > 2);
    const score = words.filter(w => m.includes(w)).length;
    if (score > bestScore) { bestScore = score; best = t; }
  }
  return bestScore >= 1 ? best : null;
}

function extractDate(segment) {
  const m = segment.toLowerCase();
  const daysLeft = m.match(/(\d+)\s+days?\s+left/);
  if (daysLeft) {
    const d = new Date(); d.setDate(d.getDate() + parseInt(daysLeft[1])); d.setHours(23,59,0,0);
    return d.toISOString();
  }
  const thisMonth = m.match(/(\d{1,2})(?:st|nd|rd|th)?\s+this\s+month/);
  if (thisMonth) {
    const d = new Date(); d.setDate(parseInt(thisMonth[1])); d.setHours(23,59,0,0);
    if (d < new Date()) d.setMonth(d.getMonth() + 1);
    return d.toISOString();
  }
  const nextMonth = m.match(/(\d{1,2})(?:st|nd|rd|th)?\s+next\s+month/);
  if (nextMonth) {
    const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(parseInt(nextMonth[1])); d.setHours(23,59,0,0);
    return d.toISOString();
  }
  const toMatch = m.match(/\b(?:to|until|by|on|from|starting)\s+(.{2,35}?)(?:\s*$|\s+instead|\s+please|\s+ok|\s+as well|\s+too|\s+also)/);
  if (toMatch) { const r = normalizeDeadline(toMatch[1].trim()); if (r) return r; }
  return normalizeDeadline(segment);
}

export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { type = "chat", messages = [], language = "en", hours = 4 } = await req.json();

    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
      orderBy: { deadline: "asc" },
    });

    if (type === "briefing") {
      const prompt = buildBriefingPrompt(language, tasks, user.name);
      const reply = await callGroq([{ role: "user", content: "Generate my morning briefing." }], prompt, 300);
      return NextResponse.json({ reply });
    }

    if (type === "plan") {
      const pending = tasks.filter(t => t.status === "pending");
      if (pending.length === 0) {
        return NextResponse.json({ plan: [], message: language === "kh" ? "មិនមានកិច្ចការជំពោះទេ!" : "No pending tasks! Add some tasks first." });
      }
      const taskList = pending.slice(0, 6).map(t => {
        const daysLeft = Math.ceil((new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        return `ID:${t.id}|${t.title}|${t.subject}|${t.priority}|${daysLeft}d left`;
      }).join("\n");
      const planPrompt = `You are Lucy, an AI study planner.
Today: ${new Date().toDateString()}. Hours per day: ${hours}.
Language for tips: ${language === "kh" ? "Khmer" : "English"}.
Tasks:\n${taskList}
Return ONLY a flat JSON array. Each object: id, title, subject, priority, allocatedHours, daysLeft, tip (max 8 words), dayNumber (starting 1, max ${hours}hrs/day).
Example: [{"id":1,"title":"Math","subject":"Math","priority":"high","allocatedHours":2,"daysLeft":5,"tip":"Review formulas first","dayNumber":1}]
ONLY return JSON array. No markdown. No explanation.`;
      const raw = await callGroq([{ role: "user", content: "Generate the flat task schedule JSON now." }], planPrompt, 1000);
      try {
        let cleaned = raw.replace(/```json|```/g, "").trim();
        const arrayMatch = cleaned.match(/\[[\s\S]*?\]/s);
        if (arrayMatch) cleaned = arrayMatch[0];
        const flatTasks = JSON.parse(cleaned);
        const dayMap = {};
        const today = new Date();
        for (const task of flatTasks) {
          const dayNum = task.dayNumber || 1;
          if (!dayMap[dayNum]) {
            const d = new Date(today); d.setDate(d.getDate() + dayNum - 1);
            dayMap[dayNum] = { day: dayNum, date: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }), tasks: [] };
          }
          dayMap[dayNum].tasks.push({ id: task.id, title: task.title, subject: task.subject, priority: task.priority, allocatedHours: task.allocatedHours || 1, daysLeft: task.daysLeft || 0, tip: task.tip || "" });
        }
        const plan = Object.values(dayMap).sort((a, b) => a.day - b.day);
        return NextResponse.json({ plan });
      } catch (e) {
        console.error("Plan parse error:", e.message);
        return NextResponse.json({ plan: [], message: "Could not generate plan, please try again." });
      }
    }

    if (type === "chat") {
      const lastMessage = messages[messages.length - 1]?.content || "";
      const userTypedKhmer = detectKhmer(lastMessage);
      const effectiveLang = userTypedKhmer ? "kh" : "en";
      const isUncertain = /\b(maybe|might|possibly|probably|i think|i'm not sure|not sure|i wonder|what if|suppose|perhaps|could be)\b/i.test(lastMessage);

      const completeKW = /\b(finish|finished|done|completed|complete|submitted|turned in|handed in|pass|passed|wrapped up|all done|បាន|រួច|ចប់|សម្រេច|បញ្ចប់)\b/i;
      const rescheduleKW = /\b(reschedule|move|change|push|update|shift|postpone|called? (in )?sick|class cancelled|school cancelled|let'?s? move|let'?s? push|let'?s? update|instead)\b/i;
      const cancelKW = /\b(cancel|cancelled|canceled|delete|remove|drop|skip|called off|not happening|never mind|forget it|ignore|discard|លុប|បោះបង់|លែង)\b/i;

      const pendingTasks = tasks.filter(t => t.status === "pending");
      const pendingActions = [];
      const usedIds = new Set();

      if (!isUncertain) {
        const actionVerbs = `reschedule|move|update|change|push|shift|postpone|cancel|delete|remove|finish|done|complete|add|mark`;
        const segments = lastMessage
          .split(new RegExp(`\\n|\\d+[.)\\s]+(?=${actionVerbs})|(?:,|;)\\s*(?=(?:${actionVerbs}))|\\s+and\\s+(?=(?:${actionVerbs}))`, "i"))
          .map(s => s.trim()).filter(s => s.length > 3);

        for (const seg of segments) {
          if (completeKW.test(seg)) {
            const t = bestMatch(seg, pendingTasks.filter(t => !usedIds.has(t.id)));
            if (t) {
              usedIds.add(t.id);
              pendingActions.push({ type: "complete", taskId: t.id, title: t.title, subject: t.subject, icon: "✅", label: `Complete "${t.title}"` });
              continue;
            }
          }
          if (rescheduleKW.test(seg)) {
            const t = bestMatch(seg, pendingTasks.filter(t => !usedIds.has(t.id)));
            if (t) {
              const newDeadline = extractDate(seg);
              if (newDeadline) {
                usedIds.add(t.id);
                pendingActions.push({
                  type: "reschedule", taskId: t.id, title: t.title, subject: t.subject,
                  newDeadline,
                  newDeadlineDisplay: new Date(newDeadline).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
                  icon: "📅", label: `Reschedule "${t.title}"`,
                });
                continue;
              }
            }
          }
          if (cancelKW.test(seg)) {
            const t = bestMatch(seg, pendingTasks.filter(t => !usedIds.has(t.id)));
            if (t) {
              usedIds.add(t.id);
              pendingActions.push({ type: "delete", taskId: t.id, title: t.title, subject: t.subject, icon: "🗑️", label: `Delete "${t.title}"` });
            }
          }
        }
      }

      const taskContext = buildTaskContext(tasks);
      const basePrompt = buildSystemPrompt(effectiveLang, taskContext);
      const langEnforcement = effectiveLang === "en"
        ? `\n\nCRITICAL: User wrote in ENGLISH. Reply in ENGLISH ONLY. No Khmer script.`
        : `\n\nបង្គាប់: ឆ្លើយជាភាសាខ្មែរទាំងស្រុង។`;
      const actionContext = pendingActions.length > 0
        ? `\n\nSYSTEM: You detected ${pendingActions.length} action(s) pending confirmation:\n${pendingActions.map(a => `${a.icon} ${a.label}`).join("\n")}\nTell the student you've prepared these changes and ask them to confirm. Do NOT say changes were made yet.`
        : "";

      const rawReply = await callGroq(messages.slice(-10), basePrompt + langEnforcement + actionContext, 400);
      const taskData = parseTaskFromResponse(rawReply);
      const cleanReply = cleanResponseText(rawReply);

      let pendingTask = null;
      if (taskData && taskData.title && taskData.subject) {
        const deadline = normalizeDeadline(taskData.deadline);
        pendingTask = {
          title: taskData.title, subject: taskData.subject,
          deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: ["high","medium","low"].includes(taskData.priority) ? taskData.priority : "medium",
          notes: taskData.notes || "",
        };
      }

      return NextResponse.json({ reply: cleanReply, pendingTask, pendingActions, language: effectiveLang });
    }

    return NextResponse.json({ message: "Invalid request type" }, { status: 400 });

  } catch (err) {
    console.error("Lucy API error:", err);
    return NextResponse.json({ message: "Lucy is taking a short break. Please try again!" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const language = searchParams.get("language") || "en";
    const tasks = await prisma.task.findMany({ where: { userId: user.id }, orderBy: { deadline: "asc" } });
    const prompt = buildBriefingPrompt(language, tasks, user.name);
    const reply = await callGroq([{ role: "user", content: "Generate my morning briefing now." }], prompt, 300);
    return NextResponse.json({ reply, taskCount: tasks.length });
  } catch (err) {
    console.error("Lucy briefing error:", err);
    return NextResponse.json({ reply: "Good morning! Let's have a productive day. 💙" });
  }
}