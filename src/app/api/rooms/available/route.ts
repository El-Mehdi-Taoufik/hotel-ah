import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializeRoom } from "@/lib/serializers";

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const checkInDate = searchParams.get("checkInDate");
    const checkOutDate = searchParams.get("checkOutDate");

    let excludedRoomIds: number[] = [];
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const overlapping = await prisma.reservationRoom.findMany({
        where: {
          reservation: {
            status: { notIn: ["Cancelled", "CheckedOut", "NoShow"] },
            checkInDate: { lt: checkOut },
            checkOutDate: { gt: checkIn },
          },
        },
        select: { roomId: true },
      });
      excludedRoomIds = overlapping.map((r) => r.roomId);
    }

    const rooms = await prisma.room.findMany({
      where: {
        isAvailable: true,
        status: { in: ["Available", "Cleaning"] },
        id: excludedRoomIds.length ? { notIn: excludedRoomIds } : undefined,
      },
      include: { roomType: true },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ success: true, data: rooms.map(serializeRoom) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
