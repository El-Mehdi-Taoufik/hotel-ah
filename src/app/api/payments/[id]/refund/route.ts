import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializePayment } from "@/lib/serializers";

const paymentInclude = { reservation: { include: { guest: true } } } as const;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const { amount } = body ?? {};

    const payment = await prisma.payment.update({
      where: { id: Number(id) },
      data: {
        status: "Refunded",
        notes: amount ? `Refunded amount: ${amount}` : "Refunded",
      },
      include: paymentInclude,
    });

    return NextResponse.json({ success: true, data: serializePayment(payment) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
