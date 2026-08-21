import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializeUser } from "@/lib/serializers";

export async function GET() {
  try {
    await requireSession();
    const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
    return NextResponse.json({ success: true, data: users.map(serializeUser) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    await requireSession();
    const body = await request.json().catch(() => null);
    const { firstName, lastName, email, password, phoneNumber, role } = body ?? {};

    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, message: "A user with this email already exists" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: await hashPassword(password),
        phoneNumber: phoneNumber || null,
        role,
      },
    });

    return NextResponse.json({ success: true, data: serializeUser(user) }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
