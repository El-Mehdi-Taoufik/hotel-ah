import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";

export async function POST() {
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

    const dump = { backedUpAt: new Date().toISOString(), roomTypes, rooms, guests, reservations, payments, settings };
    const encoded = Buffer.from(JSON.stringify(dump)).toString("base64");

    return NextResponse.json({ success: true, data: encoded, message: "Backup created" });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
