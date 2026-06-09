import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // ── Check admin first ─────────────────────────────────
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin) {
      const adminMatch = await bcrypt.compare(password, admin.password);
      if (!adminMatch) {
        return NextResponse.json(
          { message: "Invalid email or password" },
          { status: 401 }
        );
      }
      const token = await createToken({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: "admin",
      });
      const response = NextResponse.json({
        message: "Login successful",
        role: "admin",
      });
      response.cookies.set("token", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    // ── Check student ─────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await createToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: "student",
    });

    const response = NextResponse.json({
      message: "Login successful",
      role: "student",
      user: { id: user.id, name: user.name, email: user.email },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}