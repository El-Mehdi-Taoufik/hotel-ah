import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";

export async function GET() {
  try {
    await requireSession();
    const [roomTypes, rooms, guests, reservations, payments, settings] = await Promise.all([
      prisma.roomType.findMany(),
      prisma.room.findMany(),
      prisma.guest.findMany(),
      prisma.reservation.findMany({ include: { rooms: true } }),
      prisma.payment.findMany(),
      prisma.setting.findMany(),
    ]);

    const dump = { exportedAt: new Date().toISOString(), roomTypes, rooms, guests, reservations, payments, settings };

    return NextResponse.json({
      success: true,
      data: JSON.stringify(dump),
      message: "Database exported",
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
