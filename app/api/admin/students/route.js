import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const user = await verifyToken(token);
  if (!user) return null;
  return await prisma.admin.findUnique({ where: { email: user.email } });
}

export async function GET() {
  try {
    const admin = await getAdmin();
    if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const students = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { tasks: true } },
        tasks: { select: { status: true, priority: true, deadline: true } },
      },
    });

    const data = students.map(s => ({
      id: s.id, name: s.name, email: s.email, createdAt: s.createdAt,
      totalTasks: s._count.tasks,
      completedTasks: s.tasks.filter(t => t.status === "completed").length,
      pendingTasks: s.tasks.filter(t => t.status === "pending").length,
      overdueTasks: s.tasks.filter(t => t.status === "pending" && new Date(t.deadline) < new Date()).length,
      highPriority: s.tasks.filter(t => t.priority === "high" && t.status === "pending").length,
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}