import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";

export async function GET() {
  try {
    await requireSession();
    const reservations = await prisma.reservation.findMany({
      where: { status: { notIn: ["Cancelled"] } },
      include: {
        guest: true,
        payments: true,
        rooms: { include: { room: true } },
      },
      orderBy: { id: "desc" },
    });

    const pending = reservations
      .map((reservation) => {
        const amountPaid = reservation.payments
          .filter((p) => p.status !== "Refunded")
          .reduce((sum, p) => sum + p.amount, 0);
        const remainingBalance = reservation.totalAmount - amountPaid;
        return {
          reservationId: reservation.id,
          reservationNumber: reservation.reservationNumber,
          guestName: `${reservation.guest.firstName} ${reservation.guest.lastName}`,
          roomNumber: reservation.rooms[0]?.room.roomNumber ?? "",
          checkIn: reservation.checkInDate.toISOString(),
          checkOut: reservation.checkOutDate.toISOString(),
          totalAmount: reservation.totalAmount,
          amountPaid,
          remainingBalance,
          paymentStatus: amountPaid <= 0 ? "Pending" : "Partial",
          dueDate: reservation.checkInDate.toISOString(),
          createdAt: reservation.createdAt.toISOString(),
        };
      })
      .filter((p) => p.remainingBalance > 0);

    return NextResponse.json({ success: true, data: pending });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
