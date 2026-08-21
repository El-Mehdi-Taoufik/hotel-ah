import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializeRoomType } from "@/lib/serializers";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const roomType = await prisma.roomType.findUnique({ where: { id: Number(id) } });
    if (!roomType) return NextResponse.json({ success: false, message: "Room type not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: serializeRoomType(roomType) });
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
    const { name, slug, description, basePrice, maxOccupancy, maxAdults, maxChildren, amenities, imageUrl } = body ?? {};

    const roomType = await prisma.roomType.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(basePrice !== undefined && { basePrice: Number(basePrice) }),
        ...(maxOccupancy !== undefined && { maxOccupancy: Number(maxOccupancy) }),
        ...(maxAdults !== undefined && { maxAdults: Number(maxAdults) }),
        ...(maxChildren !== undefined && { maxChildren: Number(maxChildren) }),
        ...(amenities !== undefined && { amenities }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    return NextResponse.json({ success: true, data: serializeRoomType(roomType) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    await prisma.roomType.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true, message: "Room type deleted" });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
