import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeDeadline } from "@/lib/lucy";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

// POST /api/lucy/actions
// Body: { actions: [ {type, taskId, newDeadline, ...}, ... ] }
export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { actions = [] } = await req.json();
    const results = [];

    for (const action of actions) {
      try {
        // Verify task belongs to this user
        if (action.taskId) {
          const task = await prisma.task.findFirst({
            where: { id: action.taskId, userId: user.id },
          });
          if (!task) { results.push({ ...action, success: false, error: "Task not found" }); continue; }
        }

        if (action.type === "complete") {
          await prisma.task.update({
            where: { id: action.taskId },
            data: { status: "completed" },
          });
          results.push({ ...action, success: true });

        } else if (action.type === "reschedule") {
          const deadline = action.newDeadline
            ? new Date(action.newDeadline)
            : new Date(normalizeDeadline(action.newDeadlineRaw));
          await prisma.task.update({
            where: { id: action.taskId },
            data: { deadline },
          });
          results.push({ ...action, success: true });

        } else if (action.type === "delete") {
          await prisma.task.delete({ where: { id: action.taskId } });
          results.push({ ...action, success: true });

        } else if (action.type === "add") {
          const deadline = normalizeDeadline(action.deadline);
          const priority = ["high","medium","low"].includes(action.priority) ? action.priority : "medium";
          const taskData = {
            title: String(action.title),
            subject: String(action.subject),
            deadline: deadline ? new Date(deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            priority,
            status: "pending",
            userId: user.id,
          };
          if (action.notes && String(action.notes).trim()) {
            taskData.notes = String(action.notes).trim();
          }
          const newTask = await prisma.task.create({ data: taskData });
          results.push({ ...action, success: true, taskId: newTask.id });

        } else if (action.type === "priority") {
          const priority = ["high","medium","low"].includes(action.newPriority) ? action.newPriority : "medium";
          await prisma.task.update({
            where: { id: action.taskId },
            data: { priority },
          });
          results.push({ ...action, success: true });
        }
      } catch (err) {
        console.error(`Action ${action.type} failed:`, err.message);
        results.push({ ...action, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return NextResponse.json({ results, successCount });

  } catch (err) {
    console.error("Actions route error:", err);
    return NextResponse.json({ message: "Failed to execute actions" }, { status: 500 });
  }
}