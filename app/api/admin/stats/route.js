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
  // Check if admin exists with this email
  const admin = await prisma.admin.findUnique({ where: { email: user.email } });
  return admin;
}

export async function GET() {
  try {
    const admin = await getAdmin();
    if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const [totalStudents, totalTasks, completedTasks, activeSurveys, totalResponses, recentStudents] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.task.count({ where: { status: "completed" } }),
      prisma.survey.count({ where: { isActive: true } }),
      prisma.surveyResponse.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { tasks: true } } },
      }),
    ]);

    return NextResponse.json({
      totalStudents, totalTasks, completedTasks,
      activeSurveys, totalResponses, recentStudents,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}