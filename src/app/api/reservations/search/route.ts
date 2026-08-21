import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializeReservation } from "@/lib/serializers";

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") ?? "";

    const reservations = await prisma.reservation.findMany({
      where: {
        OR: [
          { reservationNumber: { contains: query } },
          { guest: { firstName: { contains: query } } },
          { guest: { lastName: { contains: query } } },
        ],
      },
      include: { guest: true, rooms: { include: { room: { include: { roomType: true } } } } },
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ success: true, data: reservations.map(serializeReservation) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
