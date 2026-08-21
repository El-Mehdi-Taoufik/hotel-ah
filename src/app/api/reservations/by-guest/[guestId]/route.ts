import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializeReservation } from "@/lib/serializers";

export async function GET(_request: Request, { params }: { params: Promise<{ guestId: string }> }) {
  try {
    await requireSession();
    const { guestId } = await params;
    const reservations = await prisma.reservation.findMany({
      where: { guestId: Number(guestId) },
      include: { guest: true, rooms: { include: { room: { include: { roomType: true } } } } },
      orderBy: { id: "desc" },
    });
    return NextResponse.json({ success: true, data: reservations.map(serializeReservation) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
