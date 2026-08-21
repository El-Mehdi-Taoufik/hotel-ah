import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializeReservation } from "@/lib/serializers";

const reservationInclude = {
  guest: true,
  rooms: { include: { room: { include: { roomType: true } } } },
} as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const { status } = body ?? {};

    if (!status) {
      return NextResponse.json({ success: false, message: "status is required" }, { status: 400 });
    }

    const reservation = await prisma.reservation.update({
      where: { id: Number(id) },
      data: {
        status,
        ...(status === "CheckedIn" && { checkedInAt: new Date() }),
        ...(status === "CheckedOut" && { checkedOutAt: new Date() }),
      },
      include: reservationInclude,
    });

    const roomStatus =
      status === "CheckedIn" ? "Occupied" : status === "CheckedOut" ? "Cleaning" : status === "Cancelled" ? "Available" : undefined;

    if (roomStatus) {
      await Promise.all(
        reservation.rooms.map((rr) =>
          prisma.room.update({
            where: { id: rr.roomId },
            data: { status: roomStatus, isAvailable: roomStatus === "Available" },
          })
        )
      );
    }

    return NextResponse.json({ success: true, data: serializeReservation(reservation) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
