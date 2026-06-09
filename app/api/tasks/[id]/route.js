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

export async function PATCH(req, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id } = await params;

  // Full edit
  if (body.isEdit) {
    const task = await prisma.task.update({
      where: { id: parseInt(id), userId: user.id },
      data: {
  title: body.title,
  subject: body.subject,
  deadline: new Date(body.deadline),
  priority: body.priority,
  notes: body.notes || "",
},
    });
    return NextResponse.json(task);
  }

  // Status update only
const task = await prisma.task.update({
  where: { id: parseInt(id), userId: user.id },
  data: {
    status: body.status,
    completedAt: body.status === "completed" ? new Date() : null,
  },
});

export async function DELETE(_, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.task.delete({
    where: { id: parseInt(id), userId: user.id },
  });
  return NextResponse.json({ message: "Task deleted" });
}
}