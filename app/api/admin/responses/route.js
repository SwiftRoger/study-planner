import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const user = await verifyToken(token);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(req) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const surveyId = parseInt(searchParams.get("surveyId"));

  if (!surveyId) return NextResponse.json({ message: "surveyId required" }, { status: 400 });

  // Get survey with questions
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  if (!survey) return NextResponse.json({ message: "Survey not found" }, { status: 404 });

  // Get all responses
  const responses = await prisma.surveyResponse.findMany({
    where: { surveyId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { submittedAt: "desc" },
  });

  const totalResponses = responses.length;

  if (totalResponses === 0) {
    return NextResponse.json({ totalResponses: 0, questions: [], overallMean: 0 });
  }

  // Calculate mean per question
  const questionAnalysis = survey.questions.map(q => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    let count = 0;

    for (const response of responses) {
      try {
        const answers = JSON.parse(response.answers);
        const score = answers[q.id];
        if (score && score >= 1 && score <= 5) {
          distribution[score]++;
          total += score;
          count++;
        }
      } catch {}
    }

    const mean = count > 0 ? total / count : 0;
    return {
      id: q.id,
      question: q.question,
      category: q.category,
      mean: Math.round(mean * 100) / 100,
      distribution,
      count,
    };
  });

  // Overall mean
  const overallMean = questionAnalysis.length > 0
    ? questionAnalysis.reduce((sum, q) => sum + q.mean, 0) / questionAnalysis.length
    : 0;

  return NextResponse.json({
    totalResponses,
    overallMean: Math.round(overallMean * 100) / 100,
    questions: questionAnalysis,
    recentRespondents: responses.slice(0, 5).map(r => ({
      name: r.user.name,
      email: r.user.email,
      submittedAt: r.submittedAt,
    })),
  });
}