import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || !(await verifyPassword(password, user.password))) {
    return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 });
  }

  const token = await createSessionCookie({
    userId: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  return NextResponse.json({
    success: true,
    data: {
      accessToken: token,
      refreshToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    },
  });
}
