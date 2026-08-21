import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializeReservation } from "@/lib/serializers";

export async function GET(_request: Request, { params }: { params: Promise<{ status: string }> }) {
  try {
    await requireSession();
    const { status } = await params;
    const reservations = await prisma.reservation.findMany({
      where: { status: decodeURIComponent(status) },
      include: { guest: true, rooms: { include: { room: { include: { roomType: true } } } } },
      orderBy: { id: "desc" },
    });
    return NextResponse.json({ success: true, data: reservations.map(serializeReservation) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
