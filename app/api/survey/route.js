import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

// GET — fetch active surveys + check if already submitted
export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const surveys = await prisma.survey.findMany({
      where: { isActive: true },
      include: {
        questions: { orderBy: { order: "asc" } },
        responses: { where: { userId: user.id } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = surveys.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      questions: s.questions,
      alreadySubmitted: s.responses.length > 0,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

// POST — submit survey response
export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { surveyId, answers } = await req.json();

    if (!surveyId || !answers) {
      return NextResponse.json({ message: "Missing data" }, { status: 400 });
    }

    // Check already submitted
    const existing = await prisma.surveyResponse.findFirst({
      where: { surveyId, userId: user.id },
    });

    if (existing) {
      return NextResponse.json({ message: "Already submitted" }, { status: 400 });
    }

    const response = await prisma.surveyResponse.create({
      data: {
        surveyId,
        userId: user.id,
        answers: JSON.stringify(answers),
      },
    });

    return NextResponse.json({ message: "Submitted!", response });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}