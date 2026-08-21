import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const startDate = new Date(searchParams.get("startDate") ?? Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date(searchParams.get("endDate") ?? Date.now());

    const totalRooms = await prisma.room.count();
    const reservations = await prisma.reservation.findMany({
      where: {
        status: { notIn: ["Cancelled"] },
        checkInDate: { lte: endDate },
        checkOutDate: { gte: startDate },
      },
      include: { rooms: true },
    });

    const data: { day: string; occupancy: number }[] = [];
    const dayMs = 24 * 60 * 60 * 1000;
    for (let t = startDate.getTime(); t <= endDate.getTime(); t += dayMs) {
      const day = new Date(t);
      const occupiedRooms = reservations.filter((r) => r.checkInDate <= day && r.checkOutDate >= day).reduce((sum, r) => sum + r.rooms.length, 0);
      data.push({
        day: DAY_NAMES[day.getUTCDay()],
        occupancy: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
