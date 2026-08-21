import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";

export async function GET() {
  try {
    await requireSession();
    const count = await prisma.notification.count({ where: { isRead: false } });
    return NextResponse.json({ data: count });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
