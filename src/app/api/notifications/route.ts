import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";

export async function GET() {
  try {
    await requireSession();
    const notifications = await prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    return NextResponse.json({
      data: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        type: n.type,
        isRead: n.isRead,
        isOverdue: n.isOverdue,
        createdAt: n.createdAt.toISOString(),
        userId: n.userId ?? undefined,
        reservationId: n.reservationId ?? undefined,
        roomId: n.roomId ?? undefined,
      })),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
