import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializeRoom } from "@/lib/serializers";

export async function GET() {
  try {
    await requireSession();
    const rooms = await prisma.room.findMany({
      include: { roomType: true },
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ success: true, data: rooms.map(serializeRoom) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    await requireSession();
    const body = await request.json().catch(() => null);
    const { roomNumber, roomTypeId, floor, status, isAvailable, notes } = body ?? {};

    if (!roomNumber || !roomTypeId || !floor) {
      return NextResponse.json({ success: false, errors: ["roomNumber, roomTypeId and floor are required"] }, { status: 400 });
    }

    const existing = await prisma.room.findUnique({ where: { roomNumber: String(roomNumber) } });
    if (existing) {
      return NextResponse.json({ success: false, errors: ["A room with this number already exists"] }, { status: 409 });
    }

    const room = await prisma.room.create({
      data: {
        roomNumber: String(roomNumber),
        roomTypeId: Number(roomTypeId),
        floor: String(floor),
        status: status || "Available",
        isAvailable: isAvailable ?? true,
        notes: notes || null,
      },
      include: { roomType: true },
    });

    return NextResponse.json({ success: true, data: serializeRoom(room) }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
