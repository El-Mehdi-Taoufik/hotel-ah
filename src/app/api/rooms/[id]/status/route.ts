import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializeRoom } from "@/lib/serializers";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const { status } = body ?? {};

    if (!status) {
      return NextResponse.json({ success: false, message: "status is required" }, { status: 400 });
    }

    const room = await prisma.room.update({
      where: { id: Number(id) },
      data: { status, isAvailable: status === "Available" },
      include: { roomType: true },
    });

    return NextResponse.json({ success: true, data: serializeRoom(room) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
