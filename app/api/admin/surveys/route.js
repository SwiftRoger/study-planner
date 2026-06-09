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
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const surveys = await prisma.survey.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true, responses: true } } },
  });
  return NextResponse.json(surveys);
}

export async function POST(req) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { title, description, questions = [] } = await req.json();
  if (!title) return NextResponse.json({ message: "Title required" }, { status: 400 });
  const survey = await prisma.survey.create({
    data: {
      title, description: description || "",
      questions: {
        create: questions.map((q, i) => ({
          question: q.question, category: q.category || "General", order: i,
        })),
      },
    },
  });
  return NextResponse.json(survey);
}