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

export async function PATCH(req, { params }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { isActive } = await req.json();
  const survey = await prisma.survey.update({ where: { id: parseInt(id) }, data: { isActive } });
  return NextResponse.json(survey);
}

export async function DELETE(_, { params }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.survey.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ message: "Deleted" });
}