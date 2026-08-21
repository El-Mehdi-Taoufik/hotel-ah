import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializeRoom } from "@/lib/serializers";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const room = await prisma.room.findUnique({ where: { id: Number(id) }, include: { roomType: true } });
    if (!room) return NextResponse.json({ success: false, message: "Room not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: serializeRoom(room) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const { roomNumber, roomTypeId, floor, status, isAvailable, notes } = body ?? {};

    const room = await prisma.room.update({
      where: { id: Number(id) },
      data: {
        ...(roomNumber !== undefined && { roomNumber: String(roomNumber) }),
        ...(roomTypeId !== undefined && { roomTypeId: Number(roomTypeId) }),
        ...(floor !== undefined && { floor: String(floor) }),
        ...(status !== undefined && { status }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(notes !== undefined && { notes }),
      },
      include: { roomType: true },
    });

    return NextResponse.json({ success: true, data: serializeRoom(room) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    await prisma.room.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
