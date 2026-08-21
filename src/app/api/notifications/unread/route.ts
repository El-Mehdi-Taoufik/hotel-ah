import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";

export async function GET() {
  try {
    await requireSession();
    const notifications = await prisma.notification.findMany({
      where: { isRead: false },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      data: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        type: n.type,
        isRead: n.isRead,
        isOverdue: n.isOverdue,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
