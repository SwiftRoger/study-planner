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

function calcSD(scores, mean) {
  if (scores.length < 2) return 0;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  return Math.sqrt(variance);
}

export async function GET(req) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const surveyId = parseInt(searchParams.get("surveyId"));

  if (!surveyId) return NextResponse.json({ message: "surveyId required" }, { status: 400 });

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  if (!survey) return NextResponse.json({ message: "Survey not found" }, { status: 404 });

  const responses = await prisma.surveyResponse.findMany({
    where: { surveyId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { submittedAt: "desc" },  // ✅ correct field from schema
  });

  const totalResponses = responses.length;

  if (totalResponses === 0) {
    return NextResponse.json({ totalResponses: 0, questions: [], overallMean: 0, overallSD: 0 });
  }

  const questionAnalysis = survey.questions.map(q => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const scores = [];

    for (const response of responses) {
      try {
        const answers = JSON.parse(response.answers);
        const score = Number(answers[q.id]);
        if (score >= 1 && score <= 5) {
          distribution[score]++;
          scores.push(score);
        }
      } catch {}
    }

    const mean = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const sd   = calcSD(scores, mean);

    return {
      id:           q.id,
      question:     q.question,
      category:     q.category,
      mean:         Math.round(mean * 100) / 100,
      sd:           Math.round(sd   * 100) / 100,
      distribution,
      count:        scores.length,
    };
  });

  const overallMean = questionAnalysis.length > 0
    ? questionAnalysis.reduce((sum, q) => sum + q.mean, 0) / questionAnalysis.length
    : 0;

  const overallSD = calcSD(questionAnalysis.map(q => q.mean), overallMean);

  return NextResponse.json({
    totalResponses,
    overallMean: Math.round(overallMean * 100) / 100,
    overallSD:   Math.round(overallSD   * 100) / 100,
    questions:   questionAnalysis,
    recentRespondents: responses.slice(0, 5).map(r => ({
      name:        r.user?.name,
      email:       r.user?.email,
      submittedAt: r.submittedAt,
    })),
  });
}