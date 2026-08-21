import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializePayment } from "@/lib/serializers";
import { generatePaymentNumber } from "@/lib/ids";

const paymentInclude = { reservation: { include: { guest: true } } } as const;

export async function GET() {
  try {
    await requireSession();
    const payments = await prisma.payment.findMany({
      include: paymentInclude,
      orderBy: { id: "desc" },
    });
    return NextResponse.json({ success: true, data: payments.map(serializePayment) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    await requireSession();
    const body = await request.json().catch(() => null);
    const { reservationId, amount, paymentMethod, paymentDate } = body ?? {};

    if (!reservationId || !amount) {
      return NextResponse.json({ success: false, message: "reservationId and amount are required" }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({ where: { id: Number(reservationId) } });
    if (!reservation) {
      return NextResponse.json({ success: false, message: "Reservation not found" }, { status: 404 });
    }

    const alreadyPaid = await prisma.payment.aggregate({
      where: { reservationId: Number(reservationId), status: { not: "Refunded" } },
      _sum: { amount: true },
    });
    const newTotal = (alreadyPaid._sum.amount ?? 0) + Number(amount);

    const payment = await prisma.payment.create({
      data: {
        paymentNumber: generatePaymentNumber(),
        reservationId: Number(reservationId),
        amount: Number(amount),
        paymentMethod: paymentMethod || "Cash",
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        status: newTotal >= reservation.totalAmount ? "Paid" : "Partial",
      },
      include: paymentInclude,
    });

    return NextResponse.json({ success: true, data: serializePayment(payment) }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
