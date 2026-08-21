import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";

export async function GET() {
  try {
    await requireSession();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalRooms,
      availableRooms,
      occupiedRooms,
      pendingHousekeeping,
      totalReservations,
      activeReservations,
      pendingReservations,
      totalGuests,
      payments,
      monthlyPayments,
    ] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { status: "Available" } }),
      prisma.room.count({ where: { status: "Occupied" } }),
      prisma.room.count({ where: { status: "Cleaning" } }),
      prisma.reservation.count(),
      prisma.reservation.count({ where: { status: { in: ["CheckedIn", "Confirmed"] } } }),
      prisma.reservation.count({ where: { status: "Pending" } }),
      prisma.guest.count(),
      prisma.payment.aggregate({ where: { status: { not: "Refunded" } }, _sum: { amount: true } }),
      prisma.payment.aggregate({
        where: { status: { not: "Refunded" }, paymentDate: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalRooms,
        availableRooms,
        occupiedRooms,
        totalReservations,
        activeReservations,
        pendingReservations,
        totalGuests,
        totalRevenue: payments._sum.amount ?? 0,
        monthlyRevenue: monthlyPayments._sum.amount ?? 0,
        pendingHousekeeping,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
