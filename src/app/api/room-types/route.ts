import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializeRoomType } from "@/lib/serializers";

export async function GET() {
  try {
    await requireSession();
    const roomTypes = await prisma.roomType.findMany({ orderBy: { id: "asc" } });
    return NextResponse.json({ success: true, data: roomTypes.map(serializeRoomType) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    await requireSession();
    const body = await request.json().catch(() => null);
    const { name, slug, description, basePrice, maxOccupancy, maxAdults, maxChildren, amenities, imageUrl } = body ?? {};

    if (!name || basePrice === undefined || maxOccupancy === undefined) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const roomType = await prisma.roomType.create({
      data: {
        name,
        slug: slug || null,
        description: description || null,
        basePrice: Number(basePrice),
        maxOccupancy: Number(maxOccupancy),
        maxAdults: Number(maxAdults ?? maxOccupancy),
        maxChildren: Number(maxChildren ?? 0),
        amenities: amenities || null,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json({ success: true, data: serializeRoomType(roomType) }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
