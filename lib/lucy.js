// ============================================================
//  lib/lucy.js  —  Lucy's Brain v3
// ============================================================

export const LUCY_VERSION = "1.0.0";

export function getLanguage() {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem("lucyLanguage") || "en";
}

export function setLanguage(lang) {
  if (typeof window !== "undefined") {
    localStorage.setItem("lucyLanguage", lang);
  }
}

export function detectKhmer(text) {
  return /[\u1780-\u17FF]/.test(text);
}

// ── Core system prompt ────────────────────────────────────────
export function buildSystemPrompt(language, taskContext = "") {
  const isKhmer = language === "kh";

  const englishPrompt = `You are Lucy, a warm but strict AI study companion at NUM Cambodia.
Personality: motherly, caring, firm, professional, casual older-sister energy.
LANGUAGE: ENGLISH ONLY. Never use Khmer script in your reply.

════════════════════════════════════════
TASK DETECTION — HIGHEST PRIORITY RULE
════════════════════════════════════════
Scan EVERY user message for these keywords:
- homework, assignment, project, essay, report, quiz, test, exam, midterm, final, presentation, lab, exercise, task, deadline, due

If ANY of these words appear, OR if the student mentions something they need to do by a date:
→ You MUST include [TASK_DATA] at the end of your reply. No exceptions.

FORMAT (copy exactly):
[TASK_DATA]{"title":"TASK TITLE IN CAPS","subject":"SUBJECT NAME","deadline":"next monday / 2026-06-15 / tomorrow / etc","priority":"high or medium or low","notes":"one helpful tip"}[/TASK_DATA]

EXAMPLES of when to create tasks:
- "I have math homework due Wednesday" → create task
- "Can you add my physics exam next Friday" → create task
- "I need to finish my English essay by tomorrow" → create task
- "Remind me about my project" → create task
- "I have coding session next next week thursday" → create task with deadline "next next week thursday"

Priority rules:
- "hard", "difficult", "important", "urgent", or deadline within 3 days → "high"
- Normal assignments with 4-7 days → "medium"
- Easy tasks or more than 1 week away → "low"
- When unsure → "medium"

ALWAYS put [TASK_DATA] at the END of your message, after your friendly reply.
NEVER skip the [TASK_DATA] block when a task is mentioned.
===========================================

WHAT ELSE YOU CAN DO:
- Answer study questions and explain concepts
- Give study schedules and techniques
- Motivate students who are procrastinating
- Summarize their current tasks when asked

RESPONSE STYLE:
- 3-5 sentences for chat responses
- Use light emojis occasionally
- When task deadline is "next week" or "tomorrow" remind them to start NOW

${taskContext ? `STUDENT'S CURRENT TASKS:\n${taskContext}` : "The student has no tasks yet."}`;

  const khmerPrompt = `អ្នកគឺជា Lucy ជំនួយការសិក្សា AI នៅ NUM កម្ពុជា។
បុគ្គលិកលក្ខណៈ: កក់ក្តៅ តឹងរ៉ឹង វិជ្ជាជីវៈ ដូចម្តាយ
ភាសា: ខ្មែរទាំងស្រុង

════════════════════════════
ការរកឃើញកិច្ចការ — ច្បាប់ 1
════════════════════════════
បើសិស្សលើកឡើងអំពី: កិច្ចការ ការប្រឡង ផ្នែក របាយការណ៍ ឬផុតកំណត់
→ ត្រូវតែបញ្ចូល [TASK_DATA] នៅចុងសារ:

[TASK_DATA]{"title":"ចំណងជើង","subject":"មុខវិជ្ជា","deadline":"ថ្ងៃ","priority":"high ឬ medium ឬ low","notes":"ដំបូន្មាន"}[/TASK_DATA]

កុំភ្លេច [TASK_DATA] នៅពេលមានកិច្ចការ!
=========================================

${taskContext ? `កិច្ចការបច្ចុប្បន្ន:\n${taskContext}` : "មិនទាន់មានកិច្ចការ។"}`;

  return isKhmer ? khmerPrompt : englishPrompt;
}

// ── Briefing prompt ───────────────────────────────────────────
export function buildBriefingPrompt(language, tasks, userName) {
  const pending = tasks.filter(t => t.status === "pending");
  const overdue = tasks.filter(t => t.status === "pending" && new Date(t.deadline) < new Date());
  const dueToday = tasks.filter(t => {
    const d = new Date(t.deadline);
    const today = new Date();
    return t.status === "pending" &&
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
  });
  const dueSoon = tasks.filter(t => {
    const diff = new Date(t.deadline) - new Date();
    const days = diff / (1000 * 60 * 60 * 24);
    return t.status === "pending" && days > 0 && days <= 3;
  });
  const highPriority = pending.filter(t => t.priority === "high");
  const taskSummary = pending.slice(0, 5).map(t => {
    const daysLeft = Math.ceil((new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return `- ${t.title} (${t.subject}) | ${t.priority} | ${daysLeft <= 0 ? "OVERDUE" : daysLeft + "d left"}`;
  }).join("\n");

  if (language === "kh") {
    return `អ្នកគឺជា Lucy។ សរសេរការណែនាំប្រចាំថ្ងៃជាភាសាខ្មែរ សម្រាប់ ${userName}។
ទិន្នន័យ: ជំពោះ ${pending.length} | ហួសសម័យ ${overdue.length} | ថ្ងៃនេះ ${dueToday.length} | ក្នុង 3ថ្ងៃ ${dueSoon.length} | ខ្ពស់ ${highPriority.length}
កិច្ចការ:\n${taskSummary || "មិនមាន"}
សរសេរ 3-4 ប្រយោគ ម្តាយ+តឹងរ៉ឹង។ ព្រមានបើហួសសម័យ។ ចប់ដោយដំបូន្មានតែមួយ។`;
  }

  return `You are Lucy. Write a morning briefing in English for ${userName}.
Stats: Pending ${pending.length} | Overdue ${overdue.length} | Today ${dueToday.length} | Due soon ${dueSoon.length} | High priority ${highPriority.length}
Tasks:\n${taskSummary || "No tasks"}
Write 3-4 sentences, motherly but firm tone. Warn about overdue. End with one specific actionable tip. Use actual task names.`;
}

// ── Task context ──────────────────────────────────────────────
export function buildTaskContext(tasks) {
  if (!tasks || tasks.length === 0) return "";
  const pending = tasks.filter(t => t.status === "pending");
  if (pending.length === 0) return "All tasks completed!";
  return pending.slice(0, 8).map(t => {
    const daysLeft = Math.ceil((new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return `• ${t.title} | ${t.subject} | ${t.priority} | ${daysLeft <= 0 ? "OVERDUE" : daysLeft + "d left"}`;
  }).join("\n");
}

// ── Parse task from response ──────────────────────────────────
export function parseTaskFromResponse(text) {
  const match = text.match(/\[TASK_DATA\]([\s\S]*?)\[\/TASK_DATA\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch (e) {
    console.error("Task parse error:", e.message, "| Raw:", match[1]);
    return null;
  }
}

export function cleanResponseText(text) {
  return text.replace(/\[TASK_DATA\][\s\S]*?\[\/TASK_DATA\]/g, "").trim();
}

// ── Deadline normalizer — handles ALL formats ─────────────────
export function normalizeDeadline(deadlineStr) {
  if (!deadlineStr) return null;

  // Already ISO format
  const parsed = new Date(deadlineStr);
  if (!isNaN(parsed.getTime()) && deadlineStr.includes("-")) {
    return parsed.toISOString();
  }

  const now = new Date();
  const lower = deadlineStr.toLowerCase().trim();

  // ── Helpers ───────────────────────────────────────────────
  function makeDate(d) {
    const date = new Date(d);
    date.setHours(23, 59, 0, 0);
    return date.toISOString();
  }
  function addDays(n) {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return makeDate(d);
  }
  function nextWeekday(targetDay) {
    const d = new Date(now);
    let diff = targetDay - d.getDay();
    if (diff <= 0) diff += 7;
    d.setDate(d.getDate() + diff);
    return makeDate(d);
  }
  function nextNextWeekday(targetDay) {
    const d = new Date(now);
    let diff = targetDay - d.getDay();
    if (diff <= 0) diff += 7;
    d.setDate(d.getDate() + diff + 7);
    return makeDate(d);
  }
  function thisWeekday(targetDay) {
    const d = new Date(now);
    let diff = targetDay - d.getDay();
    if (diff < 0) diff += 7;
    d.setDate(d.getDate() + diff);
    return makeDate(d);
  }

  // ── Exact relative terms ──────────────────────────────────
  if (lower === "today" || lower.includes("today")) return addDays(0);
  if (lower.includes("day after tomorrow")) return addDays(2);
  if (lower === "tomorrow" || lower.includes("tomorrow")) return addDays(1);

  // "Xth this month" / "X this month"
  const thisMonthMatch = lower.match(/(\d{1,2})(?:st|nd|rd|th)?\s+this\s+month/);
  if (thisMonthMatch) {
    const d = new Date(now);
    d.setDate(parseInt(thisMonthMatch[1]));
    if (d < now) d.setMonth(d.getMonth() + 1);
    return makeDate(d);
  }

  // "28th next month" / "28 next month"
  const nextMonthDayMatch = lower.match(/(\d{1,2})(?:st|nd|rd|th)?\s+next\s+month/);
  if (nextMonthDayMatch) {
    const d = new Date(now);
    d.setMonth(d.getMonth() + 1);
    d.setDate(parseInt(nextMonthDayMatch[1]));
    return makeDate(d);
  }

  // ── X days/weeks/months from now ─────────────────────────
  const inDaysMatch = lower.match(/in\s+(\d+)\s+day/);
  if (inDaysMatch) return addDays(parseInt(inDaysMatch[1]));

  const inWeeksMatch = lower.match(/in\s+(\d+)\s+week/);
  if (inWeeksMatch) return addDays(parseInt(inWeeksMatch[1]) * 7);

  const inMonthsMatch = lower.match(/in\s+(\d+)\s+month/);
  if (inMonthsMatch) return addDays(parseInt(inMonthsMatch[1]) * 30);

  const xDaysLater = lower.match(/(\d+)\s+days?\s+(from now|later|after)/);
  if (xDaysLater) return addDays(parseInt(xDaysLater[1]));

  const xWeeksLater = lower.match(/(\d+)\s+weeks?\s+(from now|later|after)/);
  if (xWeeksLater) return addDays(parseInt(xWeeksLater[1]) * 7);

  const xWeeks = lower.match(/(\d+)\s+weeks?(?!\s+ago)/);
  if (xWeeks && !lower.includes("next")) return addDays(parseInt(xWeeks[1]) * 7);

  // ── Weekday detection (MUST check "next next" before "next") ─
  const weekdays = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  for (let i = 0; i < weekdays.length; i++) {
    if (lower.includes(weekdays[i])) {
      if (lower.includes("next next") || lower.includes("week after next")) {
        return nextNextWeekday(i);
      }
      if (lower.includes("this ")) {
        return thisWeekday(i);
      }
      // Default: next occurrence of that weekday
      return nextWeekday(i);
    }
  }

  // ── Week-based (no weekday specified) ─────────────────────
  if (lower.includes("next next week") || lower.includes("week after next")) return addDays(14);
  if (lower.includes("next week")) return addDays(7);
  if (lower.includes("this week")) return addDays(7 - now.getDay()); // end of this week

  // ── End of period ─────────────────────────────────────────
  if (lower.includes("end of this week") || lower.includes("end of week")) return addDays(7 - now.getDay());
  if (lower.includes("end of next week")) return addDays(14 - now.getDay());
  if (lower.includes("end of this month") || lower.includes("end of month")) {
    return makeDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  }
  if (lower.includes("end of next month")) {
    return makeDate(new Date(now.getFullYear(), now.getMonth() + 2, 0));
  }

  // ── Month names ───────────────────────────────────────────
  const months = {
    jan:0, january:0, feb:1, february:1, mar:2, march:2,
    apr:3, april:3, may:4, jun:5, june:5, jul:6, july:6,
    aug:7, august:7, sep:8, september:8, oct:9, october:9,
    nov:10, november:10, dec:11, december:11,
  };

  // "june 25" / "june 25th" / "jun 25"
  const monthDayMatch = lower.match(/\b([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (monthDayMatch && months[monthDayMatch[1]] !== undefined) {
    const d = new Date(now);
    d.setMonth(months[monthDayMatch[1]]);
    d.setDate(parseInt(monthDayMatch[2]));
    if (d < now) d.setFullYear(d.getFullYear() + 1);
    return makeDate(d);
  }

  // "25th june" / "25 june"
  const dayMonthMatch = lower.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\b/);
  if (dayMonthMatch && months[dayMonthMatch[2]] !== undefined) {
    const d = new Date(now);
    d.setMonth(months[dayMonthMatch[2]]);
    d.setDate(parseInt(dayMonthMatch[1]));
    if (d < now) d.setFullYear(d.getFullYear() + 1);
    return makeDate(d);
  }

  // ── Slash date formats: "6/25" or "6/25/2026" ────────────
  const slashMatch = lower.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (slashMatch) {
    const d = new Date(now);
    d.setMonth(parseInt(slashMatch[1]) - 1);
    d.setDate(parseInt(slashMatch[2]));
    if (slashMatch[3]) d.setFullYear(parseInt(slashMatch[3].length === 2 ? "20" + slashMatch[3] : slashMatch[3]));
    if (d < now) d.setFullYear(d.getFullYear() + 1);
    return makeDate(d);
  }

  // ── Khmer relative terms ──────────────────────────────────
  if (lower.includes("ស្អែក")) return addDays(1);
  if (lower.includes("អាទិត្យក្រោយ")) return addDays(7);
  if (lower.includes("ខែក្រោយ")) return addDays(30);
  if (lower.includes("ពីរអាទិត្យ")) return addDays(14);

  // ── Fallback: 7 days ─────────────────────────────────────
  return addDays(7);
}