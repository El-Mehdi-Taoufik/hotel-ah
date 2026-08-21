import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";

export async function GET() {
  try {
    await requireSession();

    const [reservations, payments] = await Promise.all([
      prisma.reservation.findMany({
        include: { guest: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.payment.findMany({
        include: { reservation: { include: { guest: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const activity = [
      ...reservations.map((r) => ({
        id: r.id,
        type: "Reservation",
        description: `${r.guest.firstName} ${r.guest.lastName} - ${r.reservationNumber} (${r.status})`,
        timestamp: r.createdAt.toISOString(),
      })),
      ...payments.map((p) => ({
        id: p.id + 1_000_000,
        type: "Payment",
        description: `${p.reservation.guest.firstName} ${p.reservation.guest.lastName} paid ${p.amount} (${p.paymentMethod})`,
        timestamp: p.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 10);

    return NextResponse.json({ success: true, data: activity });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
