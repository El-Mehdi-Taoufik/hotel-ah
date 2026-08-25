import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";

export async function GET() {
  try {
    const session = await requireSession();
    const now = new Date();
    let processedExpiredReservations = 0;

    // Automatically check out guests whose stay has ended. This runs whenever
    // the notification bell polls, so it also works in the desktop/Tauri app
    // without requiring a separate cron process.
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: "CheckedIn",
        checkOutDate: { lte: now },
      },
      include: {
        guest: true,
        rooms: true,
      },
    });

    for (const reservation of expiredReservations) {
      const processed = await prisma.$transaction(async (tx) => {
        const result = await tx.reservation.updateMany({
          where: { id: reservation.id, status: "CheckedIn" },
          data: {
            status: "CheckedOut",
            checkedOutAt: now,
          },
        });

        if (result.count === 0) return false;

        await Promise.all(
          reservation.rooms.map((rr) =>
            tx.room.update({
              where: { id: rr.roomId },
              data: { status: "Cleaning", isAvailable: false },
            })
          )
        );

        await tx.notification.create({
          data: {
            title: "Guest Checked Out",
            description: `${reservation.guest.firstName} ${reservation.guest.lastName} — ${reservation.reservationNumber} — stay ended. Room sent to Cleaning.`,
            type: "Warning",
            isRead: false,
            isOverdue: false,
            userId: session.userId,
            reservationId: reservation.id,
            roomId: reservation.rooms[0]?.roomId,
          },
        });

        return true;
      });

      if (processed) processedExpiredReservations += 1;
    }

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
      processedExpiredReservations,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
