import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializeUser } from "@/lib/serializers";

export async function GET() {
  try {
    const session = await requireSession();
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return unauthorizedResponse();
    return NextResponse.json({ success: true, data: { preferredLanguage: user.preferredLanguage ?? "en" } });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json().catch(() => null);
    const { preferredLanguage } = body ?? {};

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { ...(preferredLanguage !== undefined && { preferredLanguage }) },
    });

    return NextResponse.json({ success: true, data: serializeUser(user), message: "Preferences updated" });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
